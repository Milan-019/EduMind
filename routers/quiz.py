from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from database import get_db
from models.db_models import QuizResult
from routers.auth import get_current_user
from services.analytics_engine import update_syllabus_progress
from services.planner_engine import should_rebalance, trigger_replan
from services.gemini_service import _call

router = APIRouter(tags=["Quiz"])  # renamed from quiz_router to router

# --- Models ---

class QuestionSubmission(BaseModel):
    question:        str
    selected_option: str
    correct_option:  str
    time_sec:        int = 0   # added for Module 3 time tracking

class QuizSubmitRequest(BaseModel):
    topic:   str
    subject: str        # added — needed for syllabus tracking
    answers: List[QuestionSubmission]

class QuizSubmitResponse(BaseModel):
    topic:            str
    total_questions:  int
    score:            int
    feedback:         List[dict]
    plan_rebalanced:  bool   # tells frontend if plan was auto-updated

# --- Endpoints ---

@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    req: QuizSubmitRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)   # auth added
):
    score    = 0
    feedback = []

    for item in req.answers:
        is_correct = item.selected_option.strip().upper() == \
                     item.correct_option.strip().upper()
        if is_correct:
            score += 1
            feedback.append({
                "question": item.question,
                "status":   "correct"
            })
        else:
            feedback.append({
                "question": item.question,
                "status":   "incorrect",
                "message":  f"You selected {item.selected_option}. "
                            f"Correct answer was {item.correct_option}."
            })

        # 1. Save each answer to DB
        db.add(QuizResult(
            user_id=user.id,
            topic=req.topic,
            subject=req.subject,
            correct=is_correct,
            time_sec=item.time_sec
        ))

        # 2. Update syllabus mastery for this topic
        update_syllabus_progress(
            db, user.id, req.topic, req.subject, is_correct
        )

    db.commit()

    # 3. Auto-rebalance study plan if mastery shifted
    rebalanced = False
    if should_rebalance(db, user.id) and user.exam_date:
        trigger_replan(db, user, _call)
        rebalanced = True

    return QuizSubmitResponse(
        topic=req.topic,
        total_questions=len(req.answers),
        score=score,
        feedback=feedback,
        plan_rebalanced=rebalanced
    )


@router.get("/history")
async def get_quiz_history(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    results = db.query(QuizResult)\
                .filter(QuizResult.user_id == user.id)\
                .order_by(QuizResult.created_at.desc())\
                .limit(20).all()

    return {
        "history": [
            {
                "topic":      r.topic,
                "subject":    r.subject,
                "correct":    r.correct,
                "time_sec":   r.time_sec,
                "created_at": str(r.created_at)
            }
            for r in results
        ]
    }