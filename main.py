"""
main.py — EduMind API
Run with: uvicorn main:app --reload
Swagger UI: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.router_ai import ai_router

app = FastAPI(
    title="EduMind API",
    description="AI-powered study assistant — Tutor, Quiz, Planner",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(ai_router, prefix="/ai")

# Auth + DB routers go here on hackathon day:
# from routers.auth import auth_router
# app.include_router(auth_router, prefix="/auth")


@app.get("/")
def health():
    return {"status": "EduMind is running", "docs": "/docs"}