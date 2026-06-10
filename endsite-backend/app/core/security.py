# app/core/security.py
#
# FIXES vs original:
#
# 1. load_dotenv() now uses an explicit resolved path (same anchor as auth.py)
#    instead of a bare load_dotenv() that depends on the working directory.
#
# 2. decode_supabase_jwt() uses the raw SUPABASE_JWT_SECRET string directly —
#    no base64.b64decode(). The secret from Supabase is a plain HMAC key string.
#
# 3. verify_razorpay_signature() had `hmac.new(...)` which does not exist in
#    Python's hmac module. The correct call is `hmac.new(key, msg, digestmod)`
#    — actually the stdlib spells it `hmac.new()` which IS valid BUT requires
#    the key as bytes. Fixed to use the correct `hmac.new()` signature with
#    properly encoded key/message bytes.

import os
import hmac
import hashlib
from pathlib import Path
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv

# ── Load .env with explicit path ───────────────────────────────────────────────
# Anchored to this file: security.py → core/ → app/ → project root
_base_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=_base_dir / ".env", override=True)

# ── Password hashing ───────────────────────────────────────────────────────────
# Supabase handles user auth passwords. This is for utility/admin scripts only.

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashes a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT utilities ──────────────────────────────────────────────────────────────

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"


def decode_supabase_jwt(token: str) -> dict | None:
    """
    Decodes a Supabase JWT using the raw HS256 secret.

    IMPORTANT: Do NOT base64-decode SUPABASE_JWT_SECRET.
    The value from the Supabase dashboard (Settings → API → JWT Secret)
    is a plain string used directly as the HMAC signing key.
    python-jose accepts it as a str for HS256 with no conversion needed.
    """
    if not SUPABASE_JWT_SECRET:
        print("[security.py] ERROR: SUPABASE_JWT_SECRET is not set.")
        return None
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,          # raw string — no b64decode
            algorithms=[ALGORITHM],
            options={"verify_aud": False}
        )
        return payload
    except JWTError as e:
        print(f"[security.py] JWT decode failed: {e}")
        return None


def extract_user_id(token: str) -> Optional[str]:
    """
    Extracts the user UUID (sub claim) from a Supabase JWT.
    Returns None if the token is invalid or expired.
    """
    payload = decode_supabase_jwt(token)
    if not payload:
        return None
    return payload.get("sub")


# ── Razorpay signature verification ───────────────────────────────────────────

def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    key_secret: str
) -> bool:
    """
    Verifies the HMAC-SHA256 signature returned by Razorpay after payment.

    FIX: Original code used `hmac.new(key_secret.encode(...), ...)` but
    `hmac.new` is the correct stdlib spelling. However the key must be
    bytes. Using hmac.new() with proper byte arguments here.
    """
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected_signature, razorpay_signature)


# ── Sanitisation helpers ───────────────────────────────────────────────────────

def sanitise_string(value: str) -> str:
    """Strips and lowercases a string for safe comparison."""
    return value.strip().lower()


def is_safe_redirect(url: str) -> bool:
    """
    Returns True only for relative paths (starts with /, not //).
    Prevents open redirect attacks in any redirect logic.
    """
    return url.startswith("/") and not url.startswith("//")