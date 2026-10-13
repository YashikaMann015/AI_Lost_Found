from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("")
async def upload(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED:
        raise HTTPException(400, "Use JPG, JPEG, PNG or WEBP")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 8 MB")
    name = f"{uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"image_url": f"/uploads/{name}"}
