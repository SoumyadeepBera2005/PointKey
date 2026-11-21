"""Natural-language property search → structured MySQL filter parameters.

With OPENAI_API_KEY set, LangChain + an LLM extracts the filters as JSON.
Otherwise a deterministic regex parser handles the common phrasings
(e.g. "Female student looking for single PG with food near Salt Lake under ₹8,500").
"""
import json
import os
import re

_CATEGORIES = {"room": "ROOM", "pg": "PG", "flat": "FLAT", "bhk": "FLAT"}
_LOCALITIES = ["salt lake", "new town", "park street", "ballygunge", "rajarhat", "garia", "howrah"]
_SCAM_WORDS = ("scam", "fraud", "cheat", "fake listing", "loot")


def _regex_parse(text: str) -> dict:
    t = text.lower()
    filters: dict = {}

    if "family" in t:
        filters["gender"] = "FAMILY"
        filters["occupation"] = "FAMILY"
        filters["category"] = "FLAT" if "flat" in t or "bhk" in t else None
        if filters["category"] is None:
            filters.pop("category")
    else:
        if re.search(r"\b(female|woman|girl|lady)\b", t):
            filters["gender"] = "FEMALE"
        elif re.search(r"\b(male|man|boy)\b", t):
            filters["gender"] = "MALE"
        if "student" in t:
            filters["occupation"] = "STUDENT"
        elif re.search(r"(working professional|job|office|it\b|employee)", t):
            filters["occupation"] = "WORKING_PROFESSIONAL"

    for word, cat in _CATEGORIES.items():
        if re.search(rf"\b{word}s?\b", t):
            filters["category"] = cat
            break
    if re.search(r"\b(shared|roommate|flatmate)\b", t):
        filters["sub_type"] = "SHARED_ROOM"
    elif re.search(r"\b(single|personal|private room|own room)\b", t):
        filters["sub_type"] = "PERSONAL_ROOM"

    m = re.search(r"(?:1|one)\s*bhk", t)
    if m: filters["bhk"] = "1BHK"
    m = re.search(r"(?:2|two)\s*bhk", t)
    if m: filters["bhk"] = "2BHK"
    m = re.search(r"(?:3|three)\s*bhk", t)
    if m: filters["bhk"] = "3BHK"

    m = re.search(r"(?:under|below|less than|within|max|upto|up to)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)", t)
    if m:
        filters["max_rent"] = int(m.group(1).replace(",", ""))
    else:
        m = re.search(r"(?:₹|rs\.?|inr)\s*([\d,]+)", t)
        if m: filters["max_rent"] = int(m.group(1).replace(",", ""))

    if "food" in t:
        filters["food_included"] = "true"
    if re.search(r"(private|own attached)\s*(bath|bathroom)", t):
        filters["bathroom_type"] = "PRIVATE"
    elif re.search(r"common\s*(bath|bathroom)", t):
        filters["bathroom_type"] = "COMMON"

    for loc in _LOCALITIES:
        if loc in t:
            filters["city"] = "Kolkata"
            filters["locality"] = loc.title()
            break

    return filters


_LLM_PROMPT = (
    "Extract rental-search filters from the user's message. Reply with ONLY a JSON object "
    "with optional keys: gender (MALE|FEMALE|FAMILY), occupation (STUDENT|WORKING_PROFESSIONAL|FAMILY), "
    "category (ROOM|PG|FLAT), sub_type (PERSONAL_ROOM|SHARED_ROOM|1BHK|2BHK|3BHK), bathroom_type (PRIVATE|COMMON), "
    "food_included ('true'), max_rent (number), city, locality. Omit unknown keys."
)


def parse_query(text: str) -> dict:
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            from langchain_openai import ChatOpenAI  # type: ignore
            from langchain_core.messages import HumanMessage, SystemMessage  # type: ignore
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=api_key)
            resp = llm.invoke([SystemMessage(content=_LLM_PROMPT), HumanMessage(content=text)])
            raw = resp.content.strip().removeprefix("```json").removesuffix("```").strip()
            parsed = json.loads(raw)
            return {k: str(v) for k, v in parsed.items()}
        except Exception:
            pass  # fall through to regex parser
    return _regex_parse(text)


def handle_message(text: str) -> dict:
    t = text.lower()
    if any(w in t for w in _SCAM_WORDS):
        return {
            "intent": "scam_report",
            "reply": "I'm sorry to hear that. I've flagged this for our admin team — please also use 'Report a Scam' in the app with the property code so we can act quickly.",
            "escalate": True,
            "filters": {},
        }
    if any(w in t for w in ("refund", "money back")):
        return {
            "intent": "refund_faq",
            "reply": "If your room is not confirmed, 100% of the payment is refundable. Open Profile → My Refunds and tap 'Request Refund'. It's processed automatically.",
            "escalate": False,
            "filters": {},
        }
    if any(w in t for w in ("visit", "slot", "viewing")):
        return {
            "intent": "visit_faq",
            "reply": "After unlocking a property, tap 'Book a Visit' and choose a slot — mid-morning (10–11 / 11–12), afternoon (3–4 / 4–5) or evening (7–8 / 8–9). The owner confirms; reschedule anytime.",
            "escalate": False,
            "filters": {},
        }
    filters = parse_query(text)
    return {
        "intent": "property_search",
        "reply": "Here's what I found matching your request.",
        "escalate": False,
        "filters": filters,
    }
