# app/dependencies/auth.py

import os
import base64
import httpx
from pathlib import Path

# ── CRITICAL: load .env BEFORE any os.getenv() calls ─────────────────────────
from dotenv import load_dotenv
base_dir = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=base_dir / ".env")

# ── CRITICAL: import directly from jose submodule ─────────────────────────────
# This bypasses the global `jwt` namespace that PyJWT hijacks.
# Never use `import jwt` — always use `from jose import jwt as jose_jwt`
from jose import jwt as jose_jwt
from jose.exceptions import JWTError, ExpiredSignatureError, JWTClaimsError

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

# ── Read env AFTER dotenv is loaded ───────────────────────────────────────────
SUPABASE_URL        = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

security          = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


# ── Secret normalisation ───────────────────────────────────────────────────────

def _normalise_secret(secret: str) -> tuple[str, bytes]:
    """
    Supabase provides two JWT secret formats:

    1. New projects  — plain high-entropy string, no padding
    2. Legacy projects — base64url-encoded string ending in '=='

    Returns both forms so we can try each during decode.
    """
    raw_bytes = secret.encode("utf-8")
    try:
        # Normalise padding and attempt base64 decode
        padded    = secret + "=" * (-len(secret) % 4)
        b64_bytes = base64.urlsafe_b64decode(padded)
        return secret, b64_bytes
    except Exception:
        return secret, raw_bytes


# ── Core decode — tries all valid combinations ────────────────────────────────
# ── Core decode — tries all valid combinations ────────────────────────────────

def decode_token(token: str) -> dict:
    """
    Dynamically reads the token's header algorithm first.
    Natively supports HS256, RS256, and your project's active ES256 (Elliptic Curve) signatures.
    """
    errors = []
    secret_str, secret_bytes = _normalise_secret(SUPABASE_JWT_SECRET)

    # 1. Extract the actual algorithm specified inside the token header
    try:
        unverified_header = jose_jwt.get_unverified_header(token)
        token_alg = unverified_header.get("alg", "HS256")
    except Exception:
        token_alg = "HS256"

    TARGET_ALGORITHMS = [token_alg]

    # ── Attempt 1 & 2: HS256 Checks ───────────────────────────────────────────
    if token_alg == "HS256":
        try:
            return jose_jwt.decode(
                token,
                secret_str,
                algorithms=TARGET_ALGORITHMS,
                options={"verify_aud": False},
            )
        except ExpiredSignatureError:
            raise JWTError("Token has expired")
        except Exception as e:
            errors.append(f"HS256-string failed: {e}")

        try:
            return jose_jwt.decode(
                token,
                secret_bytes,
                algorithms=TARGET_ALGORITHMS,
                options={"verify_aud": False},
            )
        except ExpiredSignatureError:
            raise JWTError("Token has expired")
        except Exception as e:
            errors.append(f"HS256-bytes failed: {e}")

    # ── Attempt 3: Asymmetric Key Checks (RS256 & ES256) via JWKS ──────────────
    if token_alg in ["RS256", "ES256"]:
        try:
            jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            response = httpx.get(jwks_url, timeout=10)
            response.raise_for_status()
            jwks = response.json()

            kid = unverified_header.get("kid") if unverified_header else None

            rsa_key = None
            for key in jwks.get("keys", []):
                # Match the public key block by its key ID (kid)
                if kid is None or key.get("kid") == kid:
                    rsa_key = key
                    break

            if rsa_key:
                # python-jose automatically builds the Elliptic Curve structure 
                # from the JWKS parameters when matching TARGET_ALGORITHMS
                return jose_jwt.decode(
                    token,
                    rsa_key,
                    algorithms=TARGET_ALGORITHMS,
                    options={"verify_aud": False},
                )
            else:
                errors.append(f"{token_alg}: No matching public key found in JWKS layout.")

        except ExpiredSignatureError:
            raise JWTError("Token has expired")
        except Exception as e:
            errors.append(f"{token_alg} verification endpoint failed: {e}")

    # ── All attempts exhausted ─────────────────────────────────────────────────
    raise JWTError(f"Token verification failed. Token uses {token_alg}. Attempts: {' | '.join(errors)}")

# ── FastAPI dependencies ───────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing subject")

    return payload

async def get_current_user_with_profile(
    payload: dict  = Depends(get_current_user),
    db: Session    = Depends(get_db),
) -> dict:
    user_id = payload.get("sub")

    row = db.execute(
        text("SELECT * FROM profiles WHERE id = :id"),
        {"id": user_id},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    # 1. Map the immutable row to a clean, mutable dictionary instantly
    profile = dict(row._mapping)

    if profile.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Your account has been blocked")

    # 2. Return the clean profile dictionary downstream instead of the row object
    return profile


def require_admin(
    profile: dict = Depends(get_current_user_with_profile),
) -> dict:
    # Since profile is already a dictionary, we read from it directly!
    if profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return profile

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(optional_security),
) -> dict | None:
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        return payload
    except JWTError:
        return None