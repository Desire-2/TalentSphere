"""
Vercel Blob storage helpers for uploads (ads, user documents, and images).
"""

from datetime import datetime, timezone
import mimetypes
import os
import re
from urllib.parse import quote

import requests


class VercelBlobStorageError(Exception):
    """Raised when upload to Vercel Blob fails."""


def _sanitize_filename(filename):
    if not filename:
        return "upload.bin"

    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", filename).strip("._")
    return cleaned or "upload.bin"


def _upload_bytes_to_vercel_blob(payload, pathname, content_type, token):
    upload_url = f"https://blob.vercel-storage.com/{quote(pathname, safe='/-._')}"

    try:
        response = requests.put(
            upload_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": content_type,
                "x-add-random-suffix": "1",
                "x-content-type": content_type,
                "x-cache-control-max-age": "31536000",
                "x-access": "public",
            },
            data=payload,
            timeout=30,
        )
    except requests.RequestException as exc:
        raise VercelBlobStorageError(f"Network error while uploading to Vercel Blob: {exc}") from exc

    if response.status_code >= 400:
        raise VercelBlobStorageError(
            f"Vercel Blob upload failed ({response.status_code}): {response.text[:250]}"
        )

    try:
        body = response.json()
    except ValueError as exc:
        raise VercelBlobStorageError("Invalid JSON response from Vercel Blob API") from exc

    uploaded_url = body.get("url")
    if not uploaded_url:
        raise VercelBlobStorageError("Vercel Blob API response did not include a public url")

    return {
        "url": uploaded_url,
        "pathname": body.get("pathname"),
        "content_type": body.get("contentType", content_type),
        "size": body.get("size"),
    }


def upload_ad_creative_image(image_file, campaign_id):
    """Upload an ad creative image to Vercel Blob and return upload metadata."""
    token = os.getenv("VERCEL_BLOB_READ_WRITE_TOKEN")
    if not token:
        raise VercelBlobStorageError("VERCEL_BLOB_READ_WRITE_TOKEN is not configured")

    filename = _sanitize_filename(getattr(image_file, "filename", "upload.bin"))
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    pathname = f"ads/campaign_{campaign_id}/creative_{timestamp}_{filename}"

    content_type = getattr(image_file, "mimetype", None) or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    image_file.seek(0)
    payload = image_file.read()
    image_file.seek(0)
    return _upload_bytes_to_vercel_blob(payload, pathname, content_type, token)


def upload_user_document(file_obj, user_id, document_type="document"):
    """Upload a user document (resume/portfolio/etc.) to Vercel Blob."""
    token = os.getenv("VERCEL_BLOB_READ_WRITE_TOKEN")
    if not token:
        raise VercelBlobStorageError("VERCEL_BLOB_READ_WRITE_TOKEN is not configured")

    filename = _sanitize_filename(getattr(file_obj, "filename", "upload.bin"))
    safe_type = _sanitize_filename(document_type or "document").lower()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    pathname = f"uploads/users/{user_id}/{safe_type}/{timestamp}_{filename}"
    content_type = getattr(file_obj, "mimetype", None) or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    file_obj.seek(0)
    payload = file_obj.read()
    file_obj.seek(0)
    return _upload_bytes_to_vercel_blob(payload, pathname, content_type, token)


def upload_user_profile_image(file_obj, user_id):
    """Upload a user's profile image to Vercel Blob."""
    token = os.getenv("VERCEL_BLOB_READ_WRITE_TOKEN")
    if not token:
        raise VercelBlobStorageError("VERCEL_BLOB_READ_WRITE_TOKEN is not configured")

    filename = _sanitize_filename(getattr(file_obj, "filename", "profile-image.bin"))
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    pathname = f"uploads/users/{user_id}/profile-images/{timestamp}_{filename}"
    content_type = getattr(file_obj, "mimetype", None) or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    file_obj.seek(0)
    payload = file_obj.read()
    file_obj.seek(0)
    return _upload_bytes_to_vercel_blob(payload, pathname, content_type, token)


def upload_company_logo_image(file_obj, owner_user_id, company_id=None):
    """Upload a company logo image to Vercel Blob."""
    return upload_company_media_image(
        file_obj=file_obj,
        owner_user_id=owner_user_id,
        company_id=company_id,
        media_type="logo",
    )


def upload_company_cover_image(file_obj, owner_user_id, company_id=None):
    """Upload a company cover image to Vercel Blob."""
    return upload_company_media_image(
        file_obj=file_obj,
        owner_user_id=owner_user_id,
        company_id=company_id,
        media_type="cover",
    )


def upload_company_gallery_image(file_obj, owner_user_id, company_id=None):
    """Upload a company gallery image to Vercel Blob."""
    return upload_company_media_image(
        file_obj=file_obj,
        owner_user_id=owner_user_id,
        company_id=company_id,
        media_type="gallery",
    )


def upload_company_media_image(file_obj, owner_user_id, company_id=None, media_type="logo"):
    """Upload a company media image (logo/cover/gallery) to Vercel Blob."""
    token = os.getenv("VERCEL_BLOB_READ_WRITE_TOKEN")
    if not token:
        raise VercelBlobStorageError("VERCEL_BLOB_READ_WRITE_TOKEN is not configured")

    safe_media_type = _sanitize_filename(media_type or "logo").lower()
    if safe_media_type not in {"logo", "cover", "gallery"}:
        raise VercelBlobStorageError("Unsupported company media type")

    filename = _sanitize_filename(getattr(file_obj, "filename", f"company-{safe_media_type}.bin"))
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")

    if company_id:
        pathname = f"uploads/companies/{company_id}/{safe_media_type}/{timestamp}_{filename}"
    else:
        pathname = f"uploads/companies/employer_{owner_user_id}/{safe_media_type}/{timestamp}_{filename}"

    content_type = getattr(file_obj, "mimetype", None) or mimetypes.guess_type(filename)[0] or "application/octet-stream"

    file_obj.seek(0)
    payload = file_obj.read()
    file_obj.seek(0)
    return _upload_bytes_to_vercel_blob(payload, pathname, content_type, token)
