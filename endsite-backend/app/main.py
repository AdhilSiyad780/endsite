# app/main.py

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from jose import jwt as jose_jwt, JWTError


from app.routers import products, cart, payments, orders, wishlist, users
from app.database import check_db_connection

load_dotenv()

# ── App instance ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="endsite API",
    description="Backend API for endsite e-commerce platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ── CORS ───────────────────────────────────────────────────────────────────────

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handlers ──────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# ── Startup event ──────────────────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup():
    print("─" * 50)
    print("  endsite API starting up...")
    db_ok = check_db_connection()
    if db_ok:
        print("  ✓ Database connected")
    else:
        print("  ✗ Database connection FAILED — check DATABASE_URL")

    required_env = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_JWT_SECRET",
        "DATABASE_URL",
        "RAZORPAY_KEY_ID",
        "RAZORPAY_KEY_SECRET",
    ]
    missing = [k for k in required_env if not os.getenv(k)]
    if missing:
        print(f"  ✗ Missing env vars: {', '.join(missing)}")
    else:
        print("  ✓ All environment variables present")
    print("─" * 50)


# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(products.router)
app.include_router(cart.router)
app.include_router(payments.router)
app.include_router(orders.router)
app.include_router(wishlist.router)
app.include_router(users.router)


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
async def root():
    return {
        "status": "ok",
        "app": "endsite API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["health"])
async def health_check():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "app": "endsite API"
    }

@app.get("/debug-jwt")
async def debug_jwt(request: Request):
    import os

    secret = os.getenv("SUPABASE_JWT_SECRET")
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()

    result = {
        "secret_loaded": secret is not None,
        "secret_length": len(secret) if secret else 0,
        "secret_first10": secret[:10] if secret else None,
        "secret_last5": secret[-5:] if secret else None,
        "token_present": bool(token),
        "token_header": None,
    }

    if token:
        try:
            result["token_header"] = jose_jwt.get_unverified_header(token)
        except Exception as e:
            result["token_header_error"] = str(e)

    if secret and token:
        # Test 1: raw string
        try:
            payload = jose_jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
            result["test_raw_string"] = "SUCCESS"
            result["sub"] = payload.get("sub")
        except JWTError as e:
            result["test_raw_string"] = f"FAILED: {e}"

        # Test 2: utf-8 bytes
        try:
            payload = jose_jwt.decode(token, secret.encode("utf-8"), algorithms=["HS256"], options={"verify_aud": False})
            result["test_utf8_bytes"] = "SUCCESS"
        except JWTError as e:
            result["test_utf8_bytes"] = f"FAILED: {e}"

        # Test 3: b64decoded bytes
        try:
            import base64
            decoded = base64.b64decode(secret + "==")
            payload = jose_jwt.decode(token, decoded, algorithms=["HS256"], options={"verify_aud": False})
            result["test_b64decoded"] = "SUCCESS"
        except Exception as e:
            result["test_b64decoded"] = f"FAILED: {e}"

    return result