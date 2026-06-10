# app/routers/cart.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.dependencies.auth import get_current_user_with_profile
from app.models.schemas import CartItemIn, CartItemUpdate, GuestCartItem

router = APIRouter(prefix="/cart", tags=["cart"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_or_create_cart(user_id: str, db: Session) -> str:
    cart = db.execute(
        text("SELECT id FROM cart WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()
    if cart:
        return str(cart.id)
    new_cart = db.execute(
        text("INSERT INTO cart (user_id) VALUES (:uid) RETURNING id"),
        {"uid": user_id}
    ).fetchone()
    db.commit()
    return str(new_cart.id)


def fetch_cart_items(cart_id: str, db: Session) -> list:
    rows = db.execute(text("""
        SELECT
            ci.id,
            ci.quantity,
            ci.variant_id,
            pv.size,
            pv.color,
            pv.stock,
            pv.sku,
            COALESCE(pv.price_override, p.base_price) AS price,
            p.id                                        AS product_id,
            p.name                                      AS product_name,
            p.base_price,
            (
                SELECT pi.image_url
                FROM product_images pi
                WHERE pi.product_id = p.id AND pi.is_primary = true
                LIMIT 1
            ) AS image_url
        FROM cart_items ci
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p          ON pv.product_id  = p.id
        WHERE ci.cart_id = :cart_id
        ORDER BY ci.id
    """), {"cart_id": cart_id}).fetchall()
    return [dict(r._mapping) for r in rows]


def validate_variant(variant_id: str, quantity: int, db: Session):
    variant = db.execute(
        text("SELECT * FROM product_variants WHERE id = :id"),
        {"id": variant_id}
    ).fetchone()
    if not variant:
        raise HTTPException(status_code=404, detail=f"Variant {variant_id} not found")
    if variant.stock < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {variant.stock} units in stock for variant {variant_id}"
        )
    return variant


# ── GET /cart ──────────────────────────────────────────────────────────────────

@router.get("")
async def get_cart(
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile["id"])
    cart = db.execute(
        text("SELECT id FROM cart WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()

    if not cart:
        return {"cart_id": None, "items": [], "total": 0, "item_count": 0}

    items = fetch_cart_items(str(cart.id), db)
    total = sum(i["price"] * i["quantity"] for i in items)

    return {
        "cart_id":    str(cart.id),
        "items":      items,
        "total":      round(total, 2),
        "item_count": sum(i["quantity"] for i in items),
    }


# ── POST /cart/items ───────────────────────────────────────────────────────────

@router.post("/items")
async def add_item(
    body: CartItemIn,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile["id"])                          # ← fixed
    validate_variant(str(body.variant_id), body.quantity, db)
    cart_id = get_or_create_cart(user_id, db)

    existing = db.execute(text("""
        SELECT id, quantity FROM cart_items
        WHERE cart_id = :cid AND variant_id = :vid
    """), {"cid": cart_id, "vid": str(body.variant_id)}).fetchone()

    if existing:
        new_qty = existing.quantity + body.quantity
        validate_variant(str(body.variant_id), new_qty, db)
        db.execute(
            text("UPDATE cart_items SET quantity = :qty WHERE id = :id"),
            {"qty": new_qty, "id": existing.id}
        )
    else:
        db.execute(text("""
            INSERT INTO cart_items (cart_id, variant_id, quantity)
            VALUES (:cid, :vid, :qty)
        """), {"cid": cart_id, "vid": str(body.variant_id), "qty": body.quantity})

    db.commit()

    items = fetch_cart_items(cart_id, db)
    total = sum(i["price"] * i["quantity"] for i in items)

    return {
        "message":    "Item added to cart",
        "items":      items,
        "total":      round(total, 2),
        "item_count": sum(i["quantity"] for i in items),
    }


# ── PUT /cart/items/{item_id} ──────────────────────────────────────────────────

@router.put("/items/{item_id}")
async def update_item(
    item_id: str,
    body: CartItemUpdate,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    item = db.execute(text("""
        SELECT ci.id, ci.variant_id, ci.cart_id
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.id
        WHERE ci.id = :item_id AND c.user_id = :uid
    """), {"item_id": item_id, "uid": str(profile["id"])}).fetchone()  # ← fixed

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    validate_variant(str(item.variant_id), body.quantity, db)

    db.execute(
        text("UPDATE cart_items SET quantity = :qty WHERE id = :id"),
        {"qty": body.quantity, "id": item_id}
    )
    db.commit()

    cart_id = str(item.cart_id)
    items   = fetch_cart_items(cart_id, db)
    total   = sum(i["price"] * i["quantity"] for i in items)

    return {
        "message":    "Cart updated",
        "items":      items,
        "total":      round(total, 2),
        "item_count": sum(i["quantity"] for i in items),
    }


# ── DELETE /cart/items/{item_id} ───────────────────────────────────────────────

@router.delete("/items/{item_id}")
async def remove_item(
    item_id: str,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    item = db.execute(text("""
        SELECT ci.id, ci.cart_id
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.id
        WHERE ci.id = :item_id AND c.user_id = :uid
    """), {"item_id": item_id, "uid": str(profile["id"])}).fetchone()  # ← fixed

    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    cart_id = str(item.cart_id)
    db.execute(text("DELETE FROM cart_items WHERE id = :id"), {"id": item_id})
    db.commit()

    items = fetch_cart_items(cart_id, db)
    total = sum(i["price"] * i["quantity"] for i in items)

    return {
        "message":    "Item removed",
        "items":      items,
        "total":      round(total, 2),
        "item_count": sum(i["quantity"] for i in items),
    }


# ── DELETE /cart ───────────────────────────────────────────────────────────────

@router.delete("")
async def clear_cart(
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    cart = db.execute(
        text("SELECT id FROM cart WHERE user_id = :uid"),
        {"uid": str(profile["id"])}                       # ← fixed
    ).fetchone()

    if not cart:
        return {"message": "Cart is already empty"}

    db.execute(
        text("DELETE FROM cart_items WHERE cart_id = :cid"),
        {"cid": str(cart.id)}
    )
    db.commit()
    return {"message": "Cart cleared", "items": [], "total": 0, "item_count": 0}


# ── POST /cart/merge ───────────────────────────────────────────────────────────

@router.post("/merge")
async def merge_guest_cart(
    items: List[GuestCartItem],
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    if not items:
        return await get_cart(profile, db)

    cart_id = get_or_create_cart(str(profile["id"]), db)  # ← fixed

    for item in items:
        variant = db.execute(
            text("SELECT id, stock FROM product_variants WHERE id = :id"),
            {"id": str(item.variant_id)}
        ).fetchone()

        if not variant:
            continue

        existing = db.execute(text("""
            SELECT id, quantity FROM cart_items
            WHERE cart_id = :cid AND variant_id = :vid
        """), {"cid": cart_id, "vid": str(item.variant_id)}).fetchone()

        if existing:
            merged_qty = min(existing.quantity + item.quantity, variant.stock)
            db.execute(
                text("UPDATE cart_items SET quantity = :qty WHERE id = :id"),
                {"qty": merged_qty, "id": existing.id}
            )
        else:
            insert_qty = min(item.quantity, variant.stock)
            if insert_qty > 0:
                db.execute(text("""
                    INSERT INTO cart_items (cart_id, variant_id, quantity)
                    VALUES (:cid, :vid, :qty)
                """), {"cid": cart_id, "vid": str(item.variant_id), "qty": insert_qty})

    db.commit()

    items_out = fetch_cart_items(cart_id, db)
    total     = sum(i["price"] * i["quantity"] for i in items_out)

    return {
        "message":    "Cart merged",
        "items":      items_out,
        "total":      round(total, 2),
        "item_count": sum(i["quantity"] for i in items_out),
    }