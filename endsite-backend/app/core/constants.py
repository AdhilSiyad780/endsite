# app/core/constants.py

# ── Order statuses ─────────────────────────────────────────────────────────────
ORDER_STATUS_PENDING    = "pending"
ORDER_STATUS_CONFIRMED  = "confirmed"
ORDER_STATUS_SHIPPED    = "shipped"
ORDER_STATUS_DELIVERED  = "delivered"
ORDER_STATUS_CANCELLED  = "cancelled"

VALID_ORDER_STATUSES = {
    ORDER_STATUS_PENDING,
    ORDER_STATUS_CONFIRMED,
    ORDER_STATUS_SHIPPED,
    ORDER_STATUS_DELIVERED,
    ORDER_STATUS_CANCELLED,
}

# Statuses from which a user can cancel
USER_CANCELLABLE_STATUSES = {ORDER_STATUS_PENDING, ORDER_STATUS_CONFIRMED}


# ── Payment statuses ───────────────────────────────────────────────────────────
PAYMENT_STATUS_PENDING  = "pending"
PAYMENT_STATUS_PAID     = "paid"
PAYMENT_STATUS_REFUNDED = "refunded"

VALID_PAYMENT_STATUSES = {
    PAYMENT_STATUS_PENDING,
    PAYMENT_STATUS_PAID,
    PAYMENT_STATUS_REFUNDED,
}


# ── User roles ─────────────────────────────────────────────────────────────────
ROLE_USER  = "user"
ROLE_ADMIN = "admin"


# ── Storage ────────────────────────────────────────────────────────────────────
STORAGE_BUCKET         = "product-images"
ALLOWED_IMAGE_TYPES    = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES   = 5 * 1024 * 1024  # 5MB
MAX_IMAGES_PER_PRODUCT = 8


# ── Cart ───────────────────────────────────────────────────────────────────────
MAX_QUANTITY_PER_ITEM = 10
MAX_ADDRESSES_PER_USER = 5


# ── Razorpay ───────────────────────────────────────────────────────────────────
RAZORPAY_CURRENCY = "INR"
PAISE_MULTIPLIER  = 100  # INR × 100 = paise


# ── Pagination ─────────────────────────────────────────────────────────────────
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE     = 100


# ── App ────────────────────────────────────────────────────────────────────────
APP_NAME    = "endsite"


APP_VERSION = "1.0.0"
API_PREFIX  = ""