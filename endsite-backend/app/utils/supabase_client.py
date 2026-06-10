# app/utils/supabase_client.py

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment")

# Service role client — bypasses RLS, use only in backend
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ── Storage helpers ────────────────────────────────────────────────────────────

BUCKET = "product-images"


def upload_image(file_bytes: bytes, file_path: str, content_type: str = "image/jpeg") -> str:
    """
    Uploads an image to Supabase Storage.
    file_path: e.g. "products/abc123/main.jpg"
    Returns the public URL of the uploaded file.
    """
    supabase.storage.from_(BUCKET).upload(
        path=file_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"}
    )
    result = supabase.storage.from_(BUCKET).get_public_url(file_path)
    return result


def delete_image(file_path: str) -> None:
    """
    Deletes an image from Supabase Storage.
    file_path: e.g. "products/abc123/main.jpg"
    """
    supabase.storage.from_(BUCKET).remove([file_path])