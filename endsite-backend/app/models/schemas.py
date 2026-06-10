# app/models/schemas.py

from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
import uuid


# ── Auth ───────────────────────────────────────────────────────────────────────

class SignupIn(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @validator("full_name")
    def full_name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    password: str

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Profile ────────────────────────────────────────────────────────────────────

class ProfileOut(BaseModel):
    id: uuid.UUID
    full_name: Optional[str]
    phone: Optional[str]
    role: str
    is_blocked: bool
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

    @validator("full_name")
    def full_name_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip() if v else v


# ── Address ────────────────────────────────────────────────────────────────────

class AddressIn(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    is_default: bool = False

    @validator("pincode")
    def pincode_valid(cls, v):
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Pincode must be a 6-digit number")
        return v

    @validator("phone")
    def phone_valid(cls, v):
        digits = v.replace("+", "").replace(" ", "")
        if not digits.isdigit() or len(digits) < 10:
            raise ValueError("Enter a valid phone number")
        return v


class AddressOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str]
    city: str
    state: str
    pincode: str
    is_default: bool

    class Config:
        from_attributes = True


# ── Category ───────────────────────────────────────────────────────────────────

class CategoryIn(BaseModel):
    name: str
    description: Optional[str] = None

    @validator("name")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Category name cannot be empty")
        return v.strip()


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Product ────────────────────────────────────────────────────────────────────

class ProductIn(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    base_price: float
    is_listed: bool = True

    @validator("name")
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Product name cannot be empty")
        return v.strip()

    @validator("base_price")
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v


class ProductOut(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]
    category_id: Optional[uuid.UUID]
    category_name: Optional[str]
    base_price: float
    is_listed: bool
    primary_image: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Variant ────────────────────────────────────────────────────────────────────

class VariantIn(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    stock: int = 0
    price_override: Optional[float] = None
    sku: str

    @validator("stock")
    def stock_non_negative(cls, v):
        if v < 0:
            raise ValueError("Stock cannot be negative")
        return v

    @validator("price_override")
    def price_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Price override must be greater than 0")
        return v

    @validator("sku")
    def sku_not_empty(cls, v):
        if not v.strip():
            raise ValueError("SKU cannot be empty")
        return v.strip().upper()


class VariantOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    size: Optional[str]
    color: Optional[str]
    stock: int
    price_override: Optional[float]
    sku: str

    class Config:
        from_attributes = True


# ── Cart ───────────────────────────────────────────────────────────────────────

class CartItemIn(BaseModel):
    variant_id: uuid.UUID
    quantity: int

    @validator("quantity")
    def quantity_positive(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class CartItemUpdate(BaseModel):
    quantity: int

    @validator("quantity")
    def quantity_positive(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class GuestCartItem(BaseModel):
    variant_id: uuid.UUID
    quantity: int

    @validator("quantity")
    def quantity_positive(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class CartItemOut(BaseModel):
    id: uuid.UUID
    variant_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    size: Optional[str]
    color: Optional[str]
    quantity: int
    price: float
    stock: int
    image_url: Optional[str]

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    cart_id: Optional[uuid.UUID]
    items: List[CartItemOut]
    total: float
    item_count: int


# ── Wishlist ───────────────────────────────────────────────────────────────────

class WishlistItemIn(BaseModel):
    product_id: uuid.UUID


class WishlistItemOut(BaseModel):
    wishlist_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    base_price: float
    min_price: Optional[float]
    primary_image: Optional[str]
    secondary_image: Optional[str]
    is_in_stock: bool
    added_at: datetime

    class Config:
        from_attributes = True


# ── Orders ─────────────────────────────────────────────────────────────────────

class OrderItemOut(BaseModel):
    id: uuid.UUID
    variant_id: uuid.UUID
    product_name: str
    size: Optional[str]
    color: Optional[str]
    quantity: int
    unit_price: float
    subtotal: float
    image_url: Optional[str]

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    address_id: uuid.UUID
    total_amount: float
    status: str
    payment_status: str
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    items: Optional[List[OrderItemOut]]

    class Config:
        from_attributes = True


class OrderStatusIn(BaseModel):
    status: str

    @validator("status")
    def status_valid(cls, v):
        valid = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
        if v not in valid:
            raise ValueError(f"Status must be one of {valid}")
        return v


# ── Payments ───────────────────────────────────────────────────────────────────

class CreateOrderIn(BaseModel):
    address_id: uuid.UUID


class VerifyPaymentIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    address_id: uuid.UUID


# ── Admin ──────────────────────────────────────────────────────────────────────

class BlockIn(BaseModel):
    is_blocked: bool


class AdminOrderStatusIn(BaseModel):
    status: str

    @validator("status")
    def status_valid(cls, v):
        valid = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
        if v not in valid:
            raise ValueError(f"Status must be one of {valid}")
        return v