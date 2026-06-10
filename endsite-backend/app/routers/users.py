# app/routers/users.py
#
# FIX vs original:
# get_current_user_with_profile now returns a plain dict (not a RowMapping).
# All profile access here is updated from profile.id → profile["id"] etc.
# to be consistent and safe regardless of SQLAlchemy version behaviour.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from app.database import get_db
from app.dependencies.auth import get_current_user_with_profile
from app.models.schemas import ProfileUpdate, AddressIn

router = APIRouter(tags=["users"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def unset_default_address(user_id: str, db: Session):
    """Removes the default flag from all addresses for a user."""
    db.execute(
        text("UPDATE addresses SET is_default = false WHERE user_id = :uid"),
        {"uid": user_id}
    )


def fetch_address(address_id: str, user_id: str, db: Session):
    """Fetches a single address row and verifies ownership. Raises 404 if missing."""
    address = db.execute(
        text("SELECT * FROM addresses WHERE id = :id AND user_id = :uid"),
        {"id": address_id, "uid": user_id}
    ).fetchone()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    return address


# ── GET /me ────────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile["id"])   # dict access — profile is a plain dict now

    order_counts = db.execute(text("""
        SELECT
            COUNT(*)                                            AS total_orders,
            COUNT(*) FILTER (WHERE status = 'pending')         AS pending_orders,
            COUNT(*) FILTER (WHERE status = 'confirmed')       AS confirmed_orders,
            COUNT(*) FILTER (WHERE status = 'shipped')         AS shipped_orders,
            COUNT(*) FILTER (WHERE status = 'delivered')       AS delivered_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled')       AS cancelled_orders
        FROM orders
        WHERE user_id = :uid
    """), {"uid": user_id}).fetchone()

    wishlist_count = db.execute(text("""
        SELECT COUNT(*) AS count FROM wishlist WHERE user_id = :uid
    """), {"uid": user_id}).fetchone()

    return {
        "id": user_id,
        "full_name": profile.get("full_name"),
        "phone": profile.get("phone"),
        "role": profile.get("role"),
        "avatar_url": profile.get("avatar_url"),
        "is_blocked": profile.get("is_blocked"),
        "created_at": profile.get("created_at"),
        "stats": {
            "total_orders":     order_counts.total_orders,
            "pending_orders":   order_counts.pending_orders,
            "confirmed_orders": order_counts.confirmed_orders,
            "shipped_orders":   order_counts.shipped_orders,
            "delivered_orders": order_counts.delivered_orders,
            "cancelled_orders": order_counts.cancelled_orders,
            "wishlist_count":   wishlist_count.count,
        }
    }


# ── PUT /me ────────────────────────────────────────────────────────────────────

@router.put("/me")
async def update_my_profile(
    body: ProfileUpdate,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    fields = {}
    if body.full_name is not None:
        fields["full_name"] = body.full_name
    if body.phone is not None:
        fields["phone"] = body.phone
    if body.avatar_url is not None:
        fields["avatar_url"] = body.avatar_url

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    set_clause = ", ".join(f"{k} = :{k}" for k in fields)
    fields["id"] = str(profile["id"])

    updated = db.execute(
        text(f"UPDATE profiles SET {set_clause} WHERE id = :id RETURNING *"),
        fields
    ).fetchone()

    db.commit()
    return dict(updated._mapping)


# ── GET /addresses ─────────────────────────────────────────────────────────────

@router.get("/addresses")
async def get_addresses(
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    rows = db.execute(text("""
        SELECT * FROM addresses
        WHERE user_id = :uid
        ORDER BY is_default DESC, created_at DESC
    """), {"uid": str(profile["id"])}).fetchall()

    return [dict(r._mapping) for r in rows]


# ── POST /addresses ────────────────────────────────────────────────────────────

@router.post("/addresses")
async def create_address(
    body: AddressIn,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile["id"])

    count_row = db.execute(
        text("SELECT COUNT(*) AS count FROM addresses WHERE user_id = :uid"),
        {"uid": user_id}
    ).fetchone()

    if count_row.count >= 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum of 5 addresses allowed. Please delete an existing address first."
        )

    if body.is_default or count_row.count == 0:
        unset_default_address(user_id, db)
        is_default = True
    else:
        is_default = body.is_default

    row = db.execute(text("""
        INSERT INTO addresses (
            user_id, full_name, phone,
            address_line1, address_line2,
            city, state, pincode, is_default
        ) VALUES (
            :uid, :full_name, :phone,
            :line1, :line2,
            :city, :state, :pincode, :is_default
        )
        RETURNING *
    """), {
        "uid":        user_id,
        "full_name":  body.full_name,
        "phone":      body.phone,
        "line1":      body.address_line1,
        "line2":      body.address_line2,
        "city":       body.city,
        "state":      body.state,
        "pincode":    body.pincode,
        "is_default": is_default,
    }).fetchone()

    db.commit()
    return dict(row._mapping)


# ── GET /addresses/{address_id} ────────────────────────────────────────────────

@router.get("/addresses/{address_id}")
async def get_address(
    address_id: str,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    address = fetch_address(address_id, str(profile["id"]), db)
    return dict(address._mapping)


# ── PUT /addresses/{address_id} ────────────────────────────────────────────────

@router.put("/addresses/{address_id}")
async def update_address(
    address_id: str,
    body: AddressIn,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile["id"])
    fetch_address(address_id, user_id, db)   # ownership check

    if body.is_default:
        unset_default_address(user_id, db)

    updated = db.execute(text("""
        UPDATE addresses
        SET
            full_name     = :full_name,
            phone         = :phone,
            address_line1 = :line1,
            address_line2 = :line2,
            city          = :city,
            state         = :state,
            pincode       = :pincode,
            is_default    = :is_default
        WHERE id = :id AND user_id = :uid
        RETURNING *
    """), {
        "full_name":  body.full_name,
        "phone":      body.phone,
        "line1":      body.address_line1,
        "line2":      body.address_line2,
        "city":       body.city,
        "state":      body.state,
        "pincode":    body.pincode,
        "is_default": body.is_default,
        "id":         address_id,
        "uid":        user_id,
    }).fetchone()

    db.commit()
    return dict(updated._mapping)


# ── DELETE /addresses/{address_id} ────────────────────────────────────────────

@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: str,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile["id"])
    address = fetch_address(address_id, user_id, db)
    was_default = address.is_default

    db.execute(
        text("DELETE FROM addresses WHERE id = :id AND user_id = :uid"),
        {"id": address_id, "uid": user_id}
    )
    db.commit()

    if was_default:
        next_address = db.execute(text("""
            SELECT id FROM addresses
            WHERE user_id = :uid
            ORDER BY created_at DESC
            LIMIT 1
        """), {"uid": user_id}).fetchone()

        if next_address:
            db.execute(
                text("UPDATE addresses SET is_default = true WHERE id = :id"),
                {"id": str(next_address.id)}
            )
            db.commit()

    return {"message": "Address deleted"}


# ── PUT /addresses/{address_id}/set-default ────────────────────────────────────

@router.put("/addresses/{address_id}/set-default")
async def set_default_address(
    address_id: str,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    user_id = str(profile["id"])
    fetch_address(address_id, user_id, db)   # ownership check
    unset_default_address(user_id, db)

    db.execute(
        text("UPDATE addresses SET is_default = true WHERE id = :id AND user_id = :uid"),
        {"id": address_id, "uid": user_id}
    )
    db.commit()
    return {"message": "Default address updated", "address_id": address_id}


# ── Admin: GET /admin/users ────────────────────────────────────────────────────

@router.get("/admin/users")
async def admin_list_users(
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db),
    search: Optional[str] = None
):
    if profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    conditions = ["1=1"]
    params: dict = {}

    if search:
        conditions.append("(p.full_name ILIKE :search OR p.phone ILIKE :search)")
        params["search"] = f"%{search}%"

    where_clause = " AND ".join(conditions)

    rows = db.execute(text(f"""
        SELECT
            p.*,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = p.id) AS total_orders,
            (
                SELECT COALESCE(SUM(o.total_amount), 0)
                FROM orders o
                WHERE o.user_id = p.id AND o.payment_status = 'paid'
            ) AS total_spent
        FROM profiles p
        WHERE {where_clause}
        ORDER BY p.created_at DESC
    """), params).fetchall()

    return [dict(r._mapping) for r in rows]


# ── Admin: GET /admin/users/{user_id} ─────────────────────────────────────────

@router.get("/admin/users/{user_id}")
async def admin_get_user(
    user_id: str,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    if profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    user = db.execute(
        text("SELECT * FROM profiles WHERE id = :id"),
        {"id": user_id}
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    orders = db.execute(text("""
        SELECT id, total_amount, status, payment_status, created_at
        FROM orders
        WHERE user_id = :uid
        ORDER BY created_at DESC
        LIMIT 10
    """), {"uid": user_id}).fetchall()

    addresses = db.execute(text("""
        SELECT * FROM addresses WHERE user_id = :uid ORDER BY is_default DESC
    """), {"uid": user_id}).fetchall()

    return {
        **dict(user._mapping),
        "recent_orders": [dict(o._mapping) for o in orders],
        "addresses":     [dict(a._mapping) for a in addresses],
    }


# ── Admin: PUT /admin/users/{user_id}/block ────────────────────────────────────

@router.put("/admin/users/{user_id}/block")
async def admin_block_user(
    user_id: str,
    profile: dict = Depends(get_current_user_with_profile),
    db: Session = Depends(get_db)
):
    if profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if str(profile["id"]) == user_id:
        raise HTTPException(status_code=400, detail="You cannot block your own account")

    user = db.execute(
        text("SELECT id, is_blocked, role FROM profiles WHERE id = :id"),
        {"id": user_id}
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot block another admin account")

    new_status = not user.is_blocked

    db.execute(
        text("UPDATE profiles SET is_blocked = :blocked WHERE id = :id"),
        {"blocked": new_status, "id": user_id}
    )
    db.commit()

    action = "blocked" if new_status else "unblocked"
    return {
        "message":    f"User {action} successfully",
        "user_id":    user_id,
        "is_blocked": new_status,
    }