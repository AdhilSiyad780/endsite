# app/routers/products.py

import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from app.database import get_db
from app.dependencies.auth import get_current_user_with_profile, require_admin
from app.utils.supabase_client import upload_image, delete_image

router = APIRouter(tags=["products"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class VariantIn(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    stock: int = 0
    price_override: Optional[float] = None
    sku: str


# ── Public: List all listed products ──────────────────────────────────────────

@router.get("/products")
async def list_products(
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "created_at_desc"
):
    conditions = ["p.is_listed = true"]
    params = {}

    if category:
        conditions.append("c.name ILIKE :category")
        params["category"] = category
    if search:
        conditions.append("p.name ILIKE :search")
        params["search"] = f"%{search}%"
    if min_price is not None:
        conditions.append("p.base_price >= :min_price")
        params["min_price"] = min_price
    if max_price is not None:
        conditions.append("p.base_price <= :max_price")
        params["max_price"] = max_price
    if color:
        conditions.append("""
            EXISTS (
                SELECT 1 FROM product_variants pv
                WHERE pv.product_id = p.id AND pv.color ILIKE :color
            )
        """)
        params["color"] = color
    if size:
        conditions.append("""
            EXISTS (
                SELECT 1 FROM product_variants pv
                WHERE pv.product_id = p.id AND pv.size ILIKE :size
            )
        """)
        params["size"] = size

    sort_map = {
        "price_asc":       "p.base_price ASC",
        "price_desc":      "p.base_price DESC",
        "created_at_desc": "p.created_at DESC",
        "created_at_asc":  "p.created_at ASC",
        "name_asc":        "p.name ASC",
        "name_desc":       "p.name DESC",
    }
    order_clause = sort_map.get(sort, "p.created_at DESC")
    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT
            p.id, p.name, p.description, p.base_price, p.is_listed,
            p.created_at, p.updated_at,
            c.id   AS category_id,
            c.name AS category_name,
            (
                SELECT pi.image_url FROM product_images pi
                WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1
            ) AS primary_image,
            (
                SELECT pi2.image_url FROM product_images pi2
                WHERE pi2.product_id = p.id AND pi2.is_primary = false
                ORDER BY pi2.display_order ASC LIMIT 1
            ) AS secondary_image,
            (
                SELECT json_agg(DISTINCT pv.color)
                FROM product_variants pv
                WHERE pv.product_id = p.id AND pv.color IS NOT NULL
            ) AS colors,
            (
                SELECT json_agg(DISTINCT pv.size)
                FROM product_variants pv
                WHERE pv.product_id = p.id AND pv.size IS NOT NULL
            ) AS sizes
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE {where_clause}
        ORDER BY {order_clause}
    """
    rows = db.execute(text(query), params).fetchall()
    return [dict(r._mapping) for r in rows]


# ── Public: Single product ─────────────────────────────────────────────────────

@router.get("/products/{product_id}")
async def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.execute(text("""
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = :id AND p.is_listed = true
    """), {"id": product_id}).fetchone()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    images = db.execute(text("""
        SELECT * FROM product_images
        WHERE product_id = :id
        ORDER BY is_primary DESC, display_order ASC
    """), {"id": product_id}).fetchall()

    variants = db.execute(text("""
        SELECT * FROM product_variants
        WHERE product_id = :id ORDER BY color, size
    """), {"id": product_id}).fetchall()

    return {
        **dict(product._mapping),
        "images":   [dict(i._mapping) for i in images],
        "variants": [dict(v._mapping) for v in variants],
    }


# ── Public: Categories ─────────────────────────────────────────────────────────

@router.get("/categories")
async def list_categories(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM categories ORDER BY name ASC")).fetchall()
    return [dict(r._mapping) for r in rows]


# ── Admin: Create category ─────────────────────────────────────────────────────

@router.post("/categories")
async def create_category(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.execute(
        text("SELECT id FROM categories WHERE name ILIKE :name"), {"name": name}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    row = db.execute(text("""
        INSERT INTO categories (name, description)
        VALUES (:name, :desc) RETURNING *
    """), {"name": name, "desc": description}).fetchone()
    db.commit()
    return dict(row._mapping)


# ── Admin: Get all products (including unlisted) ───────────────────────────────

@router.get("/admin/products")
async def admin_list_products(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    rows = db.execute(text("""
        SELECT
            p.*,
            c.name AS category_name,
            (
                SELECT pi.image_url FROM product_images pi
                WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1
            ) AS primary_image,
            (
                SELECT COUNT(*) FROM product_variants pv
                WHERE pv.product_id = p.id
            ) AS variant_count,
            (
                SELECT COUNT(*) FROM product_images pi2
                WHERE pi2.product_id = p.id
            ) AS image_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]


# ── Admin: Create product ──────────────────────────────────────────────────────

@router.post("/admin/products")
async def admin_create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    base_price: float = Form(...),
    is_listed: bool = Form(True),
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(text("""
        INSERT INTO products (name, description, category_id, base_price, is_listed)
        VALUES (:name, :desc, :cat, :price, :listed)
        RETURNING *
    """), {
        "name": name, "desc": description,
        "cat": category_id, "price": base_price, "listed": is_listed
    }).fetchone()
    db.commit()
    return dict(row._mapping)


# ── Admin: Update product ──────────────────────────────────────────────────────

@router.put("/admin/products/{product_id}")
async def admin_update_product(
    product_id: str,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    base_price: float = Form(...),
    is_listed: bool = Form(True),
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    row = db.execute(text("""
        UPDATE products
        SET name=:name, description=:desc, category_id=:cat,
            base_price=:price, is_listed=:listed, updated_at=now()
        WHERE id=:id RETURNING *
    """), {
        "name": name, "desc": description, "cat": category_id,
        "price": base_price, "listed": is_listed, "id": product_id
    }).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    db.commit()
    return dict(row._mapping)


# ── Admin: Delete product — cascades variants + images ────────────────────────

@router.delete("/admin/products/{product_id}")
async def admin_delete_product(
    product_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    # 1. Fetch all images to delete from storage
    images = db.execute(text("""
        SELECT id, image_url FROM product_images
        WHERE product_id = :id
    """), {"id": product_id}).fetchall()

    # 2. Delete images from Supabase Storage
    for img in images:
        try:
            file_path = str(img.image_url).split(
                "/storage/v1/object/public/product-images/"
            )[-1]
            delete_image(file_path)
        except Exception as e:
            print(f"[storage] Failed to delete image {img.id}: {e}")

    # 3. Delete variants explicitly (cascade handles it but be explicit)
    db.execute(text("""
        DELETE FROM product_variants WHERE product_id = :id
    """), {"id": product_id})

    # 4. Delete images from DB
    db.execute(text("""
        DELETE FROM product_images WHERE product_id = :id
    """), {"id": product_id})

    # 5. Delete product (cascade handles wishlist, cart_items via FK)
    deleted = db.execute(text("""
        DELETE FROM products WHERE id = :id RETURNING id
    """), {"id": product_id}).fetchone()

    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")

    db.commit()
    return {"message": "Product and all variants/images deleted successfully"}


# ── Admin: Upload image ────────────────────────────────────────────────────────

@router.post("/admin/products/{product_id}/images")
async def admin_upload_image(
    product_id: str,
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    display_order: int = Form(0),
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed"
        )
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    # If setting as primary, unset existing primary
    if is_primary:
        db.execute(text("""
            UPDATE product_images SET is_primary = false
            WHERE product_id = :pid
        """), {"pid": product_id})

    ext       = (file.filename or "image.jpg").split(".")[-1]
    file_path = f"products/{product_id}/{uuid.uuid4()}.{ext}"
    file_bytes = await file.read()

    image_url = upload_image(file_bytes, file_path, file.content_type)

    row = db.execute(text("""
        INSERT INTO product_images (product_id, image_url, is_primary, display_order)
        VALUES (:pid, :url, :primary, :order) RETURNING *
    """), {
        "pid": product_id, "url": image_url,
        "primary": is_primary, "order": display_order
    }).fetchone()
    db.commit()
    return dict(row._mapping)


# ── Admin: Delete single image ─────────────────────────────────────────────────

@router.delete("/admin/products/{product_id}/images/{image_id}")
async def admin_delete_image(
    product_id: str,
    image_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    image = db.execute(text("""
        SELECT * FROM product_images
        WHERE id = :id AND product_id = :pid
    """), {"id": image_id, "pid": product_id}).fetchone()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete from storage
    try:
        file_path = str(image.image_url).split(
            "/storage/v1/object/public/product-images/"
        )[-1]
        delete_image(file_path)
    except Exception as e:
        print(f"[storage] Failed to delete from storage: {e}")

    # Delete from DB
    db.execute(text("DELETE FROM product_images WHERE id = :id"), {"id": image_id})

    # If deleted image was primary, promote next image
    if image.is_primary:
        next_img = db.execute(text("""
            SELECT id FROM product_images
            WHERE product_id = :pid
            ORDER BY display_order ASC LIMIT 1
        """), {"pid": product_id}).fetchone()
        if next_img:
            db.execute(text("""
                UPDATE product_images SET is_primary = true WHERE id = :id
            """), {"id": next_img.id})

    db.commit()
    return {"message": "Image deleted"}


# ── Admin: Add variant ─────────────────────────────────────────────────────────

@router.post("/admin/products/{product_id}/variants")
async def admin_add_variant(
    product_id: str,
    body: VariantIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.execute(
        text("SELECT id FROM product_variants WHERE sku = :sku"),
        {"sku": body.sku.strip().upper()}
    ).fetchone()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"SKU '{body.sku}' already exists"
        )

    row = db.execute(text("""
        INSERT INTO product_variants
            (product_id, size, color, stock, price_override, sku)
        VALUES (:pid, :size, :color, :stock, :price, :sku)
        RETURNING *
    """), {
        "pid":   product_id,
        "size":  body.size,
        "color": body.color,
        "stock": body.stock,
        "price": body.price_override,
        "sku":   body.sku.strip().upper(),
    }).fetchone()
    db.commit()
    return dict(row._mapping)


# ── Admin: Update variant ──────────────────────────────────────────────────────

@router.put("/admin/variants/{variant_id}")
async def admin_update_variant(
    variant_id: str,
    body: VariantIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Check SKU uniqueness excluding self
    existing = db.execute(
        text("SELECT id FROM product_variants WHERE sku = :sku AND id != :id"),
        {"sku": body.sku.strip().upper(), "id": variant_id}
    ).fetchone()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"SKU '{body.sku}' already exists"
        )

    row = db.execute(text("""
        UPDATE product_variants
        SET size=:size, color=:color, stock=:stock,
            price_override=:price, sku=:sku
        WHERE id=:id RETURNING *
    """), {
        "size":  body.size,
        "color": body.color,
        "stock": body.stock,
        "price": body.price_override,
        "sku":   body.sku.strip().upper(),
        "id":    variant_id,
    }).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.commit()
    return dict(row._mapping)


# ── Admin: Delete single variant ──────────────────────────────────────────────

@router.delete("/admin/variants/{variant_id}")
async def admin_delete_variant(
    variant_id: str,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Check if variant exists
    variant = db.execute(
        text("SELECT id FROM product_variants WHERE id = :id"),
        {"id": variant_id}
    ).fetchone()

    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")

    # Remove from carts first
    db.execute(text("""
        DELETE FROM cart_items WHERE variant_id = :id
    """), {"id": variant_id})

    # Delete variant
    db.execute(text("""
        DELETE FROM product_variants WHERE id = :id
    """), {"id": variant_id})

    db.commit()
    return {"message": "Variant deleted"}