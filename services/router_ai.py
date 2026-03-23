"""
router_ai.py
------------
FastAPI router exposing all AI features.
Mount in main.py with: app.include_router(ai_router, prefix="/ai")

Endpoints:
  POST /ai/upload-pdf        — ingest a PDF into ChromaDB
  GET  /ai/knowledge-base    — list ingested files
  DELETE /ai/knowledge-base/{filename} — remove a PDF
  POST /ai/tutor             — ask a doubt
  POST /ai/quiz/generate     — generate MCQs
  POST /ai/planner/generate  — generate study plan
  POST /ai/analytics/tips    — get AI tips for weak areas
"""

import os
import shutil
import asyncio
from pathlib import Path
from functools import partial

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import BaseModel, Field

from services.rag_service import ingest_pdf, retrieve, list_ingested_files, delete_pdf
from services.gemini_service import (
    tutor_answer,
    generate_quiz,
    generate_planner,
    explain_weak_areas,
)

ai_router = APIRouter(tags=["AI"])

UPLOAD_DIR = Path("./uploaded_pdfs")
UPLOAD_DIR.mkdir(exist_ok=True)


# ── Utility: run sync in threadpool so we don't block FastAPI event loop ───────

async def _run_sync(fn, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, partial(fn, *args, **kwargs))

def _get_latest_pdf_filename() -> str | None:
    files = list(UPLOAD_DIR.glob('*.pdf'))
    if not files:
        return None
    latest = max(files, key=lambda f: f.stat().st_mtime)
    return latest.name


# ── Request / Response models ──────────────────────────────────────────────────

class TutorRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)
    history: list = Field(default_factory=list, description="Array of historical conversational dicts.")
    filename: str | None = Field(None, description="Optional filename to query. Defaults to latest PDF.")

class TutorResponse(BaseModel):
    question: str
    answer: str
    context_used: int  # number of chunks retrieved

class QuizRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=200)
    num_questions: int = Field(default=5, ge=1, le=15)
    filename: str | None = Field(None)

class PlannerRequest(BaseModel):
    subject: str = Field(..., min_length=2, max_length=200)
    weak_areas: list[str] = Field(default_factory=list)
    available_days: int = Field(default=7, ge=1, le=90)
    hours_per_day: float = Field(default=2.0, ge=0.5, le=12.0)
    filename: str | None = Field(None)

class AnalyticsTipsRequest(BaseModel):
    weak_areas: list[str] = Field(..., min_length=1)
    filename: str | None = Field(None)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@ai_router.post("/upload-pdf", status_code=status.HTTP_201_CREATED)
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF and ingest it into the knowledge base."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save to disk
    dest = UPLOAD_DIR / file.filename
    file.file.seek(0)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Ingest (sync, runs in threadpool)
    try:
        result = await _run_sync(ingest_pdf, str(dest))
    except ValueError as e:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    return result


@ai_router.get("/knowledge-base")
async def get_knowledge_base():
    """List all PDFs currently in the knowledge base."""
    files = await _run_sync(list_ingested_files)
    return {"files": files, "total": len(files)}


@ai_router.delete("/knowledge-base/{filename}")
async def remove_pdf(filename: str):
    """Remove a PDF and all its chunks from the knowledge base."""
    result = await _run_sync(delete_pdf, filename)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail=f"'{filename}' not found in knowledge base.")
    return result


@ai_router.post("/tutor", response_model=TutorResponse)
async def ask_tutor(req: TutorRequest):
    """Answer a student question using RAG-retrieved context."""
    filename = req.filename or _get_latest_pdf_filename()
    chunks = await _run_sync(retrieve, req.question, 10, filename)
    
    # Inject history right into the question string so we don't have to change gemini_service.py!
    query_text = req.question
    if req.history:
        history_lines = [f"{m.get('role', 'user').upper()}: {m.get('parts', [{}])[0].get('text', '')}" for m in req.history[-4:]]
        query_text = "Previous conversation context:\n" + "\n".join(history_lines) + "\n\nCurrent Question: " + req.question
        
    answer = await _run_sync(tutor_answer, query_text, chunks)
    return TutorResponse(
        question=req.question,
        answer=answer,
        context_used=len(chunks),
    )


@ai_router.post("/quiz/generate")
async def quiz_generate(req: QuizRequest):
    """Generate MCQs on a topic, grounded in uploaded study material."""
    filename = req.filename or _get_latest_pdf_filename()
    # Retrieve context relevant to the topic
    chunks = await _run_sync(retrieve, req.topic, 10, filename)
    questions = await _run_sync(generate_quiz, req.topic, chunks, req.num_questions)

    if not questions:
        raise HTTPException(
            status_code=500,
            detail="Quiz generation failed — Gemini returned an unexpected format. Try again."
        )

    return {
        "topic": req.topic,
        "num_questions": len(questions),
        "questions": questions,
    }


@ai_router.post("/planner/generate")
async def planner_generate(req: PlannerRequest):
    """Generate a personalised study plan based on uploaded material and weak areas."""
    filename = req.filename or _get_latest_pdf_filename()
    
    # Get broad context about the subject
    chunks = await _run_sync(retrieve, req.subject, 10, filename)

    # Also pull context for each weak area
    for area in req.weak_areas[:3]:  # cap at 3 to avoid huge prompts
        weak_chunks = await _run_sync(retrieve, area, 3, filename)
        chunks.extend(weak_chunks)

    # Deduplicate
    chunks = list(dict.fromkeys(chunks))[:10]

    plan = await _run_sync(
        generate_planner,
        req.subject,
        chunks,
        req.weak_areas,
        req.available_days,
        req.hours_per_day,
    )

    return plan


@ai_router.post("/analytics/tips")
async def analytics_tips(req: AnalyticsTipsRequest):
    """Get targeted AI advice for a student's weak areas."""
    filename = req.filename or _get_latest_pdf_filename()
    
    # Retrieve context for each weak area
    chunks = []
    for area in req.weak_areas[:4]:
        area_chunks = await _run_sync(retrieve, area, 3, filename)
        chunks.extend(area_chunks)
    chunks = list(dict.fromkeys(chunks))[:10]

    tips = await _run_sync(explain_weak_areas, req.weak_areas, chunks)
    return {"weak_areas": req.weak_areas, "tips": tips}