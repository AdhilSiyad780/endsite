# app/routers/wishlist.py
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.dependencies.auth import get_current_user_with_profile
from app.models.schemas import WishlistItemIn, WishlistItemOut

router = APIRouter(prefix="/wishlist", tags=["wishlist"])

# ── HELPER FUNCTION TO FETCH CLEAN ROWS ────────────────────────────────────────
def _get_user_wishlist_items(user_id: str, db: Session) -> list:
    """
    Executes the database query to get all items in the user's wishlist
    and converts them safely into standard Python dictionaries.
    """
    result = db.execute(text("""
        SELECT w.id as wishlist_id, p.* FROM wishlist w
        JOIN products p ON w.product_id = p.id
        WHERE w.user_id = :uid AND p.is_listed = true
    """), {"uid": user_id}).fetchall()
    
    return [dict(row._mapping) for row in result]


# ── GET /wishlist ──────────────────────────────────────────────────────────────
@router.get("")
async def fetch_wishlist_endpoint(  # <-- Renamed endpoint to avoid recursion collision
    profile = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    # Safely fetch the data from our helper function using dictionary lookup
    items = _get_user_wishlist_items(str(profile["id"]), db)
    return {
        "items": items,
        "count": len(items)
    }

# ── POST /wishlist ─────────────────────────────────────────────────────────────
@router.post("")
async def add_to_wishlist(
    body: WishlistItemIn,
    profile = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    product = db.execute(text("""
        SELECT id, name FROM products
        WHERE id = :pid AND is_listed = true
    """), {"pid": body.product_id}).fetchone()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.execute(text("""
        SELECT id FROM wishlist
        WHERE user_id = :uid AND product_id = :pid
    """), {"uid": str(profile["id"]), "pid": body.product_id}).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Product already in wishlist")

    db.execute(text("""
        INSERT INTO wishlist (user_id, product_id)
        VALUES (:uid, :pid)
    """), {"uid": str(profile["id"]), "pid": body.product_id})
    db.commit()

    items = _get_user_wishlist_items(str(profile["id"]), db)
    return {
        "message": f"'{product.name}' added to wishlist",
        "items": items,
        "count": len(items)
    }

# ── DELETE /wishlist/{product_id} ──────────────────────────────────────────────
@router.delete("/{product_id}")
async def remove_from_wishlist(
    product_id: str,
    profile = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    existing = db.execute(text("""
        SELECT id FROM wishlist
        WHERE user_id = :uid AND product_id = :pid
    """), {"uid": str(profile["id"]), "pid": product_id}).fetchone()

    if not existing:
        raise HTTPException(status_code=404, detail="Product not in wishlist")

    db.execute(text("""
        DELETE FROM wishlist
        WHERE user_id = :uid AND product_id = :pid
    """), {"uid": str(profile["id"]), "pid": product_id})
    db.commit()

    items = _get_user_wishlist_items(str(profile["id"]), db)
    return {
        "message": "Removed from wishlist",
        "items": items,
        "count": len(items)
    }

# ── DELETE /wishlist — clear entire wishlist ───────────────────────────────────
@router.delete("")
async def clear_wishlist(
    profile = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    db.execute(text("""
        DELETE FROM wishlist WHERE user_id = :uid
    """), {"uid": str(profile["id"])})
    db.commit()

    return {
        "message": "Wishlist cleared",
        "items": [],
        "count": 0
    }

# ── GET /wishlist/check/{product_id} ─────────────────────────────────────────
@router.get("/check/{product_id}")
async def check_wishlist(
    product_id: str,
    profile = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    existing = db.execute(text("""
        SELECT id FROM wishlist
        WHERE user_id = :uid AND product_id = :pid
    """), {"uid": str(profile["id"]), "pid": product_id}).fetchone()

    return {
        "is_wishlisted": existing is not None,
        "product_id": product_id
    }