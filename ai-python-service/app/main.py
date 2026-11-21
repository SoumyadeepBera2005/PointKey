from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.verify_router import router as verify_router
from app.routers.ai_router import router as ai_router

app = FastAPI(title="pRent AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(verify_router)
app.include_router(ai_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "prent-ai-service"}
