from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.db_models import StudyPlan
from routers.auth import get_current_user
from services.planner_engine import trigger_replan
from services.gemini_service import _call
import json

router = APIRouter(tags=["Planner"])

class PlanRequest(BaseModel):
    exam_date: str

@router.post("/generate")
def generate(req: PlanRequest,
             db: Session = Depends(get_db),
             user=Depends(get_current_user)):
    user.exam_date = req.exam_date
    db.commit()
    plan = trigger_replan(db, user, _call)
    return {"plan": plan, "total_days": len(plan)}

@router.get("/latest")
def latest(db: Session = Depends(get_db), user=Depends(get_current_user)):
    sp = db.query(StudyPlan).filter_by(user_id=user.id)\
           .order_by(StudyPlan.id.desc()).first()
    return {"plan": json.loads(sp.plan_json) if sp else [], "auto_generated": sp is not None}