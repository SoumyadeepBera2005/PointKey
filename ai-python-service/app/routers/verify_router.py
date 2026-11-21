import logging

from fastapi import APIRouter, File, Form, UploadFile

from app.services.face_verification import verify_owner
from app.services.ocr_service import extract_id_text

logger = logging.getLogger("prent.verify")
router = APIRouter()


@router.post("/verify-owner-face")
async def verify_owner_face(
    live_selfie: UploadFile = File(...),
    id_card_image: UploadFile = File(...),
    id_card_type: str = Form("GOVT_ID"),
):
    selfie_bytes = await live_selfie.read()
    id_bytes = await id_card_image.read()
    if not selfie_bytes or not id_bytes:
        return {"status": "ERROR", "detail": "Both images are required"}

    result = verify_owner(selfie_bytes, id_bytes)
    result["ocr"] = extract_id_text(id_bytes, id_card_image.filename or id_card_type)
    result["id_card_type"] = id_card_type
    return result
