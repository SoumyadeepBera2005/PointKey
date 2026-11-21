import os

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.chatbot_agent import handle_message

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: str | None = None


def _persist_scam_report(message: str, user_id: str | None) -> bool:
    """Best-effort: escalate scam reports into reports_and_tickets (spec §3-F)."""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url or not user_id:
        return False
    try:
        import uuid
        import pymysql
        # DATABASE_URL=mysql+pymysql://user:pass@host:port/db
        url = database_url.replace("mysql+pymysql://", "", 1)
        creds, rest = url.split("@", 1)
        user, password = creds.split(":", 1)
        hostport, db = rest.split("/", 1)
        host, port = hostport.split(":", 1)
        conn = pymysql.connect(host=host, port=int(port), user=user, password=password, database=db)
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO reports_and_tickets (id, reporter_id, type, description) VALUES (%s, %s, 'SCAM', %s)",
                (str(uuid.uuid4()), user_id, message[:2000]),
            )
        conn.commit()
        conn.close()
        return True
    except Exception:
        return False


@router.post("/ai-chatbot")
async def ai_chatbot(req: ChatRequest):
    result = handle_message(req.message)
    if result.get("escalate"):
        result["escalated"] = _persist_scam_report(req.message, req.user_id)
    return result
