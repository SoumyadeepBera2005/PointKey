"""Owner face verification: liveness (anti-spoof) + DeepFace match against Govt ID.

Heavy ML deps are optional. When DeepFace/MediaPipe are unavailable or models
fail to load, we return an explicit FALLBACK result (score=None, liveness=False)
so the backend queues the verification for manual admin review instead of
silently approving.
"""
import io
import logging

import numpy as np
from PIL import Image

logger = logging.getLogger("prent.face")

try:
    from deepface import DeepFace  # type: ignore
    _DEEPFACE = True
except Exception:  # pragma: no cover - dep optional
    _DEEPFACE = False

try:
    import cv2  # type: ignore
    import mediapipe as mp  # type: ignore
    _MEDIAPIPE = True
except Exception:  # pragma: no cover - dep optional
    _MEDIAPIPE = False


def _load_image(raw: bytes) -> np.ndarray:
    return np.array(Image.open(io.BytesIO(raw)).convert("RGB"))


def liveness_check(selfie_bytes: bytes) -> dict:
    """Anti-spoofing: Laplacian variance (sharpness) via OpenCV + MediaPipe face presence."""
    img = _load_image(selfie_bytes)
    if _MEDIAPIPE:
        try:
            bgr = img[:, :, ::-1].copy()
            sharpness = float(cv2.Laplacian(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
            with mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.6) as fd:
                detected = bool(fd.process(img).detections)
            return {"liveness_passed": detected and sharpness > 15.0, "sharpness": sharpness, "face_detected": detected}
        except Exception as e:  # pragma: no cover
            logger.warning("liveness pipeline failed: %s", e)
            return {"liveness_passed": False, "detail": str(e)}
    # Fallback: sharpness-only heuristic with PIL/numpy (no OpenCV available)
    gray = np.asarray(Image.fromarray(img).convert("L"), dtype=np.float32)
    lap = np.abs(np.diff(gray, axis=0)).mean() + np.abs(np.diff(gray, axis=1)).mean()
    return {"liveness_passed": bool(lap > 8.0), "sharpness": float(lap), "detail": "fallback_sharpness_only"}


def face_match(selfie_bytes: bytes, id_card_bytes: bytes) -> dict:
    """VGG-Face cosine similarity between the selfie and the ID-card photo."""
    if not _DEEPFACE:
        return {"ai_match_score": None, "verified": False, "detail": "FALLBACK_UNVERIFIED — deepface not installed; manual admin review required"}
    try:
        import tempfile, os
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f1:
            f1.write(selfie_bytes); selfie_path = f1.name
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as f2:
            f2.write(id_card_bytes); id_path = f2.name
        try:
            result = DeepFace.verify(img1_path=selfie_path, img2_path=id_path,
                                     model_name="VGG-Face", distance_metric="cosine",
                                     enforce_detection=False)
            distance = float(result.get("distance", 1.0))
            score = round(max(0.0, (1.0 - distance)) * 100, 2)
            return {"ai_match_score": score, "verified": bool(result.get("verified")), "distance": distance}
        finally:
            os.unlink(selfie_path); os.unlink(id_path)
    except Exception as e:
        logger.warning("face match failed: %s", e)
        return {"ai_match_score": None, "verified": False, "detail": f"FALLBACK_UNVERIFIED — {e}"}


def verify_owner(selfie_bytes: bytes, id_card_bytes: bytes) -> dict:
    live = liveness_check(selfie_bytes)
    match = face_match(selfie_bytes, id_card_bytes)
    liveness_passed = bool(live.get("liveness_passed"))
    ai_match_score = match.get("ai_match_score")
    # Pass only when both checks are positive; otherwise admin reviews manually
    auto_pass = liveness_passed and match.get("verified") is True
    return {
        "liveness_passed": liveness_passed,
        "liveness_detail": live,
        "ai_match_score": ai_match_score,
        "face_match_detail": match,
        "status": "AUTO_PASS" if auto_pass else "PENDING",
    }
