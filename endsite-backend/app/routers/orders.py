# app/routers/orders.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.dependencies.auth import get_current_user_with_profile, require_admin
from app.models.schemas import OrderStatusIn
from app.core.constants import USER_CANCELLABLE_STATUSES

router = APIRouter(prefix="/orders", tags=["orders"])


# ── Helpers ────────────────────────────────────────────────────────────────────

VALID_STATUSES = {"pending", "confirmed", "shipped", "delivered", "cancelled"}


def fetch_order_items(order_id: str, db: Session) -> list:
    """Returns all items for a given order."""
    rows = db.execute(text("""
        SELECT
            oi.id,
            oi.variant_id,
            oi.product_name,
            oi.size,
            oi.color,
            oi.quantity,
            oi.unit_price,
            (oi.quantity * oi.unit_price) AS subtotal,
            (
                SELECT pi.image_url
                FROM product_images pi
                JOIN product_variants pv ON pv.product_id = pi.product_id
                WHERE pv.id = oi.variant_id AND pi.is_primary = true
                LIMIT 1
            ) AS image_url
        FROM order_items oi
        WHERE oi.order_id = :oid
        ORDER BY oi.id
    """), {"oid": order_id}).fetchall()
    return [dict(r._mapping) for r in rows]


def fetch_order_address(address_id: str, db: Session) -> dict:
    """Returns address snapshot for an order."""
    row = db.execute(text("""
        SELECT * FROM addresses WHERE id = :id
    """), {"id": address_id}).fetchone()
    return dict(row._mapping) if row else {}


def fetch_full_order(order_id: str, db: Session) -> dict:
    """Returns order with items and address."""
    order = db.execute(text("""
        SELECT
            o.*,
            p.full_name  AS customer_name,
            p.phone      AS customer_phone
        FROM orders o
        JOIN profiles p ON o.user_id = p.id
        WHERE o.id = :id
    """), {"id": order_id}).fetchone()

    if not order:
        return None

    order_dict = dict(order._mapping)
    order_dict["items"] = fetch_order_items(order_id, db)
    order_dict["address"] = fetch_order_address(str(order_dict["address_id"]), db)
    return order_dict


# ── GET /orders — user's order history ────────────────────────────────────────

@router.get("")
async def get_my_orders(
    profile=Depends(get_current_user_with_profile),
    db: Session = Depends(get_db),
    status: Optional[str] = None
):
    conditions = ["o.user_id = :uid"]
    params = {"uid": str(profile.id)}

    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {VALID_STATUSES}")
        conditions.append("o.status = :status")
        params["status"] = status

    where_clause = " AND ".join(conditions)

    orders = db.execute(text(f"""
        SELECT
            o.id,
            o.total_amount,
            o.status,
            o.payment_status,
            o.razorpay_order_id,
            o.razorpay_payment_id,
            o.created_at,
            o.updated_at,
            (
                SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id
            ) AS item_count,
            (
                SELECT oi2.product_name
                FROM order_items oi2
                WHERE oi2.order_id = o.id
                LIMIT 1
            ) AS first_item_name,
            (
                SELECT pi.image_url
                FROM order_items oi3
                JOIN product_variants pv ON pv.id = oi3.variant_id
                JOIN product_images pi   ON pi.product_id = pv.product_id AND pi.is_primary = true
                WHERE oi3.order_id = o.id
                LIMIT 1
            ) AS first_item_image
        FROM orders o
        WHERE {where_clause}
        ORDER BY o.created_at DESC
    """), params).fetchall()

    return [dict(r._mapping) for r in orders]


# ── GET /orders/{order_id} — single order detail ──────────────────────────────

@router.get("/{order_id}")
async def get_order(
    order_id: str,
    profile=Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    order = fetch_full_order(order_id, db)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Users can only see their own orders
    if str(order["user_id"]) != str(profile.id) and profile.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    return order


# ── PUT /orders/{order_id}/cancel — user cancel ───────────────────────────────

@router.put("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    profile=Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    order = db.execute(text("""
        SELECT id, user_id, status, payment_status
        FROM orders
        WHERE id = :id
    """), {"id": order_id}).fetchone()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Users can only cancel their own orders
    if str(order.user_id) != str(profile.id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Can only cancel pending or confirmed orders
    if order.status not in USER_CANCELLABLE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel an order with status '{order.status}'"
        )

    # Update status — does NOT auto-refund
    db.execute(text("""
        UPDATE orders
        SET status = 'cancelled', updated_at = now()
        WHERE id = :id
    """), {"id": order_id})

    # Restore stock for each item
    items = db.execute(text("""
        SELECT variant_id, quantity FROM order_items WHERE order_id = :oid
    """), {"oid": order_id}).fetchall()

    for item in items:
        db.execute(text("""
            UPDATE product_variants
            SET stock = stock + :qty
            WHERE id = :id
        """), {"qty": item.quantity, "id": str(item.variant_id)})

    db.commit()

    return {
        "message": "Order cancelled successfully",
        "order_id": order_id,
        "status": "cancelled",
        "payment_status": order.payment_status,
        "refund_note": "Refund processing is handled separately by admin"
    }


# ── Admin: GET /orders/admin/all — all orders ──────────────────────────────────

@router.get("/admin/all")
async def admin_list_orders(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    payment_status: Optional[str] = None
):
    conditions = ["1=1"]
    params = {}

    if status:
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {VALID_STATUSES}")
        conditions.append("o.status = :status")
        params["status"] = status

    if payment_status:
        valid_payment = {"pending", "paid", "refunded"}
        if payment_status not in valid_payment:
            raise HTTPException(status_code=400, detail=f"Invalid payment_status. Must be one of {valid_payment}")
        conditions.append("o.payment_status = :payment_status")
        params["payment_status"] = payment_status

    where_clause = " AND ".join(conditions)

    orders = db.execute(text(f"""
        SELECT
            o.id,
            o.total_amount,
            o.status,
            o.payment_status,
            o.razorpay_order_id,
            o.razorpay_payment_id,
            o.created_at,
            o.updated_at,
            p.full_name  AS customer_name,
            p.phone      AS customer_phone,
            (
                SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id
            ) AS item_count
        FROM orders o
        JOIN profiles p ON o.user_id = p.id
        WHERE {where_clause}
        ORDER BY o.created_at DESC
    """), params).fetchall()

    return [dict(r._mapping) for r in orders]


# ── Admin: GET /orders/admin/{order_id} — full order detail ───────────────────

@router.get("/admin/{order_id}")
async def admin_get_order(
    order_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = fetch_full_order(order_id, db)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ── Admin: PUT /orders/admin/{order_id}/status — update order status ──────────

@router.put("/admin/{order_id}/status")
async def admin_update_order_status(
    order_id: str,
    body: OrderStatusIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of {VALID_STATUSES}"
        )

    order = db.execute(text("""
        SELECT id, status FROM orders WHERE id = :id
    """), {"id": order_id}).fetchone()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Restore stock if admin is cancelling
    if body.status == "cancelled" and order.status not in {"cancelled"}:
        items = db.execute(text("""
            SELECT variant_id, quantity FROM order_items WHERE order_id = :oid
        """), {"oid": order_id}).fetchall()

        for item in items:
            db.execute(text("""
                UPDATE product_variants
                SET stock = stock + :qty
                WHERE id = :id
            """), {"qty": item.quantity, "id": str(item.variant_id)})

    updated = db.execute(text("""
        UPDATE orders
        SET status = :status, updated_at = now()
        WHERE id = :id
        RETURNING *
    """), {"status": body.status, "id": order_id}).fetchone()

    db.commit()
    return dict(updated._mapping)