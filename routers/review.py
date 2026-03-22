from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from routers.auth import get_current_user
from services.spaced_repetition import sm2_update, get_due_cards, create_or_get_card

router = APIRouter(tags=["Spaced Repetition"])

class ReviewRequest(BaseModel):
    topic:   str
    subject: str
    quality: int  # 0 to 5

@router.get("/due")
def due_cards(db: Session = Depends(get_db), user=Depends(get_current_user)):
    cards = get_due_cards(db, user.id)
    return {
        "due_today": len(cards),
        "cards": [
            {
                "id":          c.id,
                "topic":       c.topic,
                "subject":     c.subject,
                "interval":    c.interval,
                "repetitions": c.repetitions,
                "next_review": c.next_review,
            }
            for c in cards
        ]
    }

@router.post("/review")
def review_card(req: ReviewRequest,
                db: Session = Depends(get_db),
                user=Depends(get_current_user)):
    if not 0 <= req.quality <= 5:
        raise HTTPException(400, "Quality must be between 0 and 5")
    card    = create_or_get_card(db, user.id, req.topic, req.subject)
    updated = sm2_update(card, req.quality)
    db.commit()
    return {
        "topic":        updated.topic,
        "new_interval": updated.interval,
        "next_review":  updated.next_review,
        "easiness":     round(updated.easiness, 2),
        "repetitions":  updated.repetitions,
        "message":      f"Next review in {updated.interval} day(s)"
    }

@router.post("/add-card")
def add_card(req: ReviewRequest,
             db: Session = Depends(get_db),
             user=Depends(get_current_user)):
    card = create_or_get_card(db, user.id, req.topic, req.subject)
    return {
        "message":     f"Card ready for {req.topic}",
        "next_review": card.next_review
    }