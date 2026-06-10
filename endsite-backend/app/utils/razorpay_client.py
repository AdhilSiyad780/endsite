# app/utils/razorpay_client.py

import os
import hmac
import hashlib
import razorpay
from dotenv import load_dotenv

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    raise RuntimeError("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment")

# ── Razorpay client instance ───────────────────────────────────────────────────

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ── Order creation ─────────────────────────────────────────────────────────────

def create_razorpay_order(amount_paise: int, receipt: str) -> dict:
    """
    Creates a Razorpay order.
    amount_paise: total in paise (INR × 100)
    receipt: short unique string e.g. "order_abc123"
    Returns the full Razorpay order object.
    """
    order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1  # auto-capture on payment success
    })
    return order


# ── Signature verification ─────────────────────────────────────────────────────

def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
) -> bool:
    """
    Verifies the HMAC SHA256 signature from Razorpay webhook/callback.
    Returns True if valid, False if tampered.
    """
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


# ── Refund stub — NOT active ───────────────────────────────────────────────────

async def process_refund(payment_id: str, amount: int):
    """
    Razorpay refund stub. NOT active.
    To activate: wire this into a POST /admin/payments/refund route.
    Amount in paise (INR × 100).
    """
    refund = razorpay_client.payment.refund(payment_id, {"amount": amount})
    return refund