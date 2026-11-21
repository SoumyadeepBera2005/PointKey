"""Govt ID text extraction. Uses a vision LLM when OPENAI_API_KEY is set,
else returns a minimal OCR hint (document type guess from filename/bytes header).
This is advisory-only; admins always see the original images.
"""
import json
import os


def extract_id_text(image_bytes: bytes, filename_hint: str = "") -> dict:
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            import base64
            from langchain_openai import ChatOpenAI  # type: ignore
            from langchain_core.messages import HumanMessage  # type: ignore
            b64 = base64.b64encode(image_bytes).decode()
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=api_key)
            msg = HumanMessage(content=[
                {"type": "text", "text": "Extract name, ID number and DOB from this Indian government ID. Reply with JSON only: {name, id_number, dob, id_type}."},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
            ])
            resp = llm.invoke([msg])
            raw = resp.content.strip().removeprefix("```json").removesuffix("```").strip()
            return {"ok": True, "extracted": json.loads(raw)}
        except Exception as e:
            return {"ok": False, "detail": f"vision extraction failed: {e}"}
    hint = filename_hint.lower()
    doc = "AADHAAR" if "aadhaar" in hint or "aadhar" in hint else ("PAN" if "pan" in hint else "GOVT_ID")
    return {"ok": True, "extracted": {"id_type": doc}, "detail": "fallback — no vision model configured; manual admin review"}
