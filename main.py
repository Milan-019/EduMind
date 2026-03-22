"""
main.py — EduMind API
Run with: uvicorn main:app --reload
Swagger UI: http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# DB — must import models BEFORE create_all so SQLAlchemy knows the tables
from database import Base, engine
import models.db_models
Base.metadata.create_all(bind=engine)

# Routers
from services.router_ai import ai_router
from routers.auth import router as auth_router
from routers.quiz import router as quiz_router
# from routers.analytics import router as analytics_router
# from routers.planner import router as planner_router

app = FastAPI(
    title="EduMind API",
    description="AI-powered JEE/NEET study assistant",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(ai_router,        prefix="/ai")
app.include_router(auth_router,      prefix="/auth")
app.include_router(quiz_router,      prefix="/quiz")
# app.include_router(analytics_router, prefix="/analytics")
# app.include_router(planner_router,   prefix="/planner")

@app.get("/")
def health():
    return {"status": "EduMind is running", "docs": "/docs"}