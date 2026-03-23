from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import QuizResult, SyllabusProgress
from routers.auth import get_current_user
from services.analytics_engine import compute_analytics
from services.gemini_service import explain_weak_areas
from services.rag_service import retrieve

router = APIRouter(tags=["Analytics"])

@router.get("/report")
def report(db: Session = Depends(get_db), user=Depends(get_current_user)):
    results  = db.query(QuizResult).filter(QuizResult.user_id == user.id).all()
    data     = compute_analytics(results)
    if data.get("weak_areas"):
        chunks = []
        for area in data["weak_areas"][:3]:
            chunks.extend(retrieve(area, 2))
        data["study_tips"] = explain_weak_areas(data["weak_areas"], chunks)
    return data

@router.get("/syllabus")
def syllabus_coverage(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(SyllabusProgress).filter(
        SyllabusProgress.user_id == user.id
    ).all()
    return {
        "coverage": [
            {
                "topic":          r.topic,
                "subject":        r.subject,
                "status":         r.status,
                "mastery_score":  round(r.mastery_score * 100, 1),
                "times_attempted": r.times_attempted,
                "last_studied":   r.last_studied,
            }
            for r in rows
        ],
        "summary": {
            "completed":   sum(1 for r in rows if r.status == "completed"),
            "in_progress": sum(1 for r in rows if r.status == "in_progress"),
            "pending":     sum(1 for r in rows if r.status == "pending"),
        }
    }