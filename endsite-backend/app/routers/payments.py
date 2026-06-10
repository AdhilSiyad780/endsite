# app/routers/payments.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.dependencies.auth import get_current_user_with_profile
from app.utils.razorpay_client import create_razorpay_order, verify_payment_signature
from app.models.schemas import CreateOrderIn,VerifyPaymentIn

router = APIRouter(prefix="/payments", tags=["payments"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_cart_with_items(user_id: str, db: Session):
    """Returns (cart_id, items) or raises 400 if cart is empty."""
    cart = db.execute(
        text("SELECT id FROM cart WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()

    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")

    items = db.execute(text("""
        SELECT
            ci.id                                       AS cart_item_id,
            ci.quantity,
            ci.variant_id,
            pv.size,
            pv.color,
            pv.stock,
            COALESCE(pv.price_override, p.base_price)  AS unit_price,
            p.id                                        AS product_id,
            p.name                                      AS product_name
        FROM cart_items ci
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p          ON pv.product_id  = p.id
        WHERE ci.cart_id = :cid
    """), {"cid": str(cart.id)}).fetchall()

    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    return str(cart.id), [dict(i._mapping) for i in items]


def validate_address(address_id: str, user_id: str, db: Session):
    """Ensures the address exists and belongs to the user."""
    address = db.execute(text("""
        SELECT id FROM addresses
        WHERE id = :aid AND user_id = :uid
    """), {"aid": address_id, "uid": user_id}).fetchone()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    return address


def validate_stock(items: list, db: Session):
    """Ensures all cart items still have sufficient stock before payment."""
    for item in items:
        variant = db.execute(
            text("SELECT stock FROM product_variants WHERE id = :id"),
            {"id": item["variant_id"]}
        ).fetchone()

        if not variant or variant.stock < item["quantity"]:
            raise HTTPException(
                status_code=400,
                detail=f"'{item['product_name']}' ({item['size'] or ''} {item['color'] or ''}) "
                       f"only has {variant.stock if variant else 0} units in stock"
            )


def clear_user_cart(cart_id: str, db: Session):
    """Deletes all items from the user's cart after successful order."""
    db.execute(
        text("DELETE FROM cart_items WHERE cart_id = :cid"),
        {"cid": cart_id}
    )


def deduct_stock(items: list, db: Session):
    """Reduces stock for each variant after successful order."""
    for item in items:
        db.execute(text("""
            UPDATE product_variants
            SET stock = stock - :qty
            WHERE id = :id
        """), {"qty": item["quantity"], "id": item["variant_id"]})


# ── POST /payments/create-order ────────────────────────────────────────────────

@router.post("/payments/create-order")
async def create_order(
    body: CreateOrderIn,
    profile=Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile.id)

    # Validate address ownership
    validate_address(body.address_id, user_id, db)

    # Get cart items
    cart_id, items = get_cart_with_items(user_id, db)

    # Validate stock levels before creating payment
    validate_stock(items, db)

    # Calculate total in paise (INR × 100)
    total_amount = sum(i["unit_price"] * i["quantity"] for i in items)
    total_paise = int(round(total_amount * 100))

    # Create Razorpay order
    receipt = f"endsite_{user_id[:8]}"
    try:
        rz_order = create_razorpay_order(total_paise, receipt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {str(e)}")

    return {
        "razorpay_order_id": rz_order["id"],
        "amount": total_paise,
        "amount_display": round(total_amount, 2),
        "currency": "INR",
        "key_id": __import__("os").getenv("RAZORPAY_KEY_ID"),
        "cart_items": items
    }


# ── POST /payments/verify ──────────────────────────────────────────────────────

@router.post("/payments/verify")
async def verify_payment(
    body: VerifyPaymentIn,
    profile=Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile.id)

    # 1. Verify HMAC SHA256 signature
    is_valid = verify_payment_signature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Payment verification failed: invalid signature")

    # 2. Validate address
    validate_address(body.address_id, user_id, db)

    # 3. Get cart items (re-fetch to get latest state)
    cart_id, items = get_cart_with_items(user_id, db)

    # 4. Validate stock one final time
    validate_stock(items, db)

    # 5. Calculate total
    total_amount = sum(i["unit_price"] * i["quantity"] for i in items)

    # 6. Create order record
    order = db.execute(text("""
        INSERT INTO orders (
            user_id,
            address_id,
            total_amount,
            status,
            payment_status,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )
        VALUES (
            :uid,
            :aid,
            :total,
            'confirmed',
            'paid',
            :rz_oid,
            :rz_pid,
            :rz_sig
        )
        RETURNING id, created_at
    """), {
        "uid": user_id,
        "aid": body.address_id,
        "total": round(total_amount, 2),
        "rz_oid": body.razorpay_order_id,
        "rz_pid": body.razorpay_payment_id,
        "rz_sig": body.razorpay_signature
    }).fetchone()

    order_id = str(order.id)

    # 7. Insert order items as snapshots
    for item in items:
        db.execute(text("""
            INSERT INTO order_items (
                order_id,
                variant_id,
                product_name,
                size,
                color,
                quantity,
                unit_price
            )
            VALUES (
                :oid,
                :vid,
                :pname,
                :size,
                :color,
                :qty,
                :price
            )
        """), {
            "oid": order_id,
            "vid": item["variant_id"],
            "pname": item["product_name"],
            "size": item["size"],
            "color": item["color"],
            "qty": item["quantity"],
            "price": item["unit_price"]
        })

    # 8. Deduct stock
    deduct_stock(items, db)

    # 9. Clear cart
    clear_user_cart(cart_id, db)

    db.commit()

    return {
        "message": "Payment verified and order placed",
        "order_id": order_id,
        "total_amount": round(total_amount, 2),
        "created_at": order.created_at
    }


# ── REFUND STUB — NOT registered as a route ────────────────────────────────────

async def process_refund(payment_id: str, amount: int):
    """
    Razorpay refund stub. NOT active.
    To activate:
      1. Uncomment @router.post('/payments/refund') below
      2. Add admin guard: admin=Depends(require_admin)
      3. Wire the admin UI refund button
    Amount must be in paise (INR × 100).
    """
    # @router.post("/payments/refund")
    from app.utils.razorpay_client import razorpay_client
    refund = razorpay_client.payment.refund(payment_id, {"amount": amount})
    return refund