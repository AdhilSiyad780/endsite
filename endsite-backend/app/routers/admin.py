from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.dependencies.auth import require_admin
from pydantic import BaseModel
from typing import Optional
from app.models.schemas import ProductIn,VariantIn,OrderStatusIn,BlockIn
router = APIRouter(prefix="/admin", tags=["admin"])




# ── Products ───────────────────────────────────────────────────────────────────

@router.get("/products")
async def admin_list_products(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    rows = db.execute(text("""
        SELECT p.*, c.name as category_name,
          (SELECT image_url FROM product_images pi
           WHERE pi.product_id = p.id AND pi.is_primary LIMIT 1) as primary_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]


@router.post("/products")
async def admin_create_product(
    body: ProductIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(text("""
        INSERT INTO products (name, description, category_id, base_price, is_listed)
        VALUES (:name, :desc, :cat, :price, :listed)
        RETURNING *
    """), {
        "name": body.name, "desc": body.description,
        "cat": body.category_id, "price": body.base_price,
        "listed": body.is_listed
    }).fetchone()
    db.commit()
    return dict(row._mapping)


@router.put("/products/{product_id}")
async def admin_update_product(
    product_id: str,
    body: ProductIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(text("""
        UPDATE products
        SET name=:name, description=:desc, category_id=:cat,
            base_price=:price, is_listed=:listed, updated_at=now()
        WHERE id=:id
        RETURNING *
    """), {
        "name": body.name, "desc": body.description, "cat": body.category_id,
        "price": body.base_price, "listed": body.is_listed, "id": product_id
    }).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    db.commit()
    return dict(row._mapping)


@router.delete("/products/{product_id}")
async def admin_delete_product(
    product_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    db.execute(text("DELETE FROM products WHERE id = :id"), {"id": product_id})
    db.commit()
    return {"message": "Product deleted"}


# ── Variants ───────────────────────────────────────────────────────────────────

@router.post("/products/{product_id}/variants")
async def admin_add_variant(
    product_id: str,
    body: VariantIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(text("""
        INSERT INTO product_variants (product_id, size, color, stock, price_override, sku)
        VALUES (:pid, :size, :color, :stock, :price, :sku)
        RETURNING *
    """), {
        "pid": product_id, "size": body.size, "color": body.color,
        "stock": body.stock, "price": body.price_override, "sku": body.sku
    }).fetchone()
    db.commit()
    return dict(row._mapping)


@router.put("/variants/{variant_id}")
async def admin_update_variant(
    variant_id: str,
    body: VariantIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(text("""
        UPDATE product_variants
        SET size=:size, color=:color, stock=:stock, price_override=:price, sku=:sku
        WHERE id=:id
        RETURNING *
    """), {
        "size": body.size, "color": body.color, "stock": body.stock,
        "price": body.price_override, "sku": body.sku, "id": variant_id
    }).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.commit()
    return dict(row._mapping)


@router.delete("/variants/{variant_id}")
async def admin_delete_variant(
    variant_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    db.execute(text("DELETE FROM product_variants WHERE id = :id"), {"id": variant_id})
    db.commit()
    return {"message": "Variant deleted"}


# ── Orders ─────────────────────────────────────────────────────────────────────

@router.get("/orders")
async def admin_list_orders(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    rows = db.execute(text("""
        SELECT o.*, p.full_name as customer_name, p.phone as customer_phone
        FROM orders o
        JOIN profiles p ON o.user_id = p.id
        ORDER BY o.created_at DESC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]


@router.get("/orders/{order_id}")
async def admin_get_order(
    order_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    order = db.execute(
        text("SELECT * FROM orders WHERE id = :id"), {"id": order_id}
    ).fetchone()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = db.execute(
        text("SELECT * FROM order_items WHERE order_id = :id"), {"id": order_id}
    ).fetchall()

    return {**dict(order._mapping), "items": [dict(i._mapping) for i in items]}


@router.put("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str,
    body: OrderStatusIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    valid = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")

    row = db.execute(text("""
        UPDATE orders SET status=:status, updated_at=now()
        WHERE id=:id RETURNING *
    """), {"status": body.status, "id": order_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found")
    db.commit()
    return dict(row._mapping)


# ── Users ──────────────────────────────────────────────────────────────────────

@router.get("/users")
async def admin_list_users(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    rows = db.execute(text("""
        SELECT * FROM profiles ORDER BY created_at DESC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]


@router.get("/users/{user_id}")
async def admin_get_user(
    user_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(
        text("SELECT * FROM profiles WHERE id = :id"), {"id": user_id}
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row._mapping)


@router.put("/users/{user_id}/block")
async def admin_block_user(
    user_id: str,
    body: BlockIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(text("""
        UPDATE profiles SET is_blocked=:blocked WHERE id=:id RETURNING *
    """), {"blocked": body.is_blocked, "id": user_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    db.commit()
    action = "blocked" if body.is_blocked else "unblocked"
    return {"message": f"User {action}", "user": dict(row._mapping)}