import re
import json
from datetime import date
from models.db_models import SyllabusProgress, StudyPlan

def build_syllabus_context(progress_rows, exam_target) -> str:
    from services.planner_engine import ALL_TOPICS
    attempted = {p.topic: p for p in progress_rows}
    lines     = []
    for item in ALL_TOPICS.get(exam_target, {}).get("all", []):
        topic   = item["topic"]
        subject = item["subject"]
        if topic in attempted:
            p = attempted[topic]
            lines.append(
                f"- {subject} | {topic} | "
                f"status={p.status} | "
                f"mastery={round(p.mastery_score * 100)}% | "
                f"attempts={p.times_attempted}"
            )
        else:
            lines.append(f"- {subject} | {topic} | status=pending | mastery=0% | attempts=0")
    return "\n".join(lines)


ALL_TOPICS = {
    "JEE": {"all": [
        {"topic": "Mechanics",            "subject": "Physics"},
        {"topic": "Thermodynamics",       "subject": "Physics"},
        {"topic": "Electrostatics",       "subject": "Physics"},
        {"topic": "Optics",               "subject": "Physics"},
        {"topic": "Modern Physics",       "subject": "Physics"},
        {"topic": "Waves",                "subject": "Physics"},
        {"topic": "Mole Concept",         "subject": "Chemistry"},
        {"topic": "Equilibrium",          "subject": "Chemistry"},
        {"topic": "Organic Reactions",    "subject": "Chemistry"},
        {"topic": "Electrochemistry",     "subject": "Chemistry"},
        {"topic": "Inorganic Chem",       "subject": "Chemistry"},
        {"topic": "Calculus",             "subject": "Maths"},
        {"topic": "Algebra",              "subject": "Maths"},
        {"topic": "Coordinate Geometry",  "subject": "Maths"},
        {"topic": "Vectors",              "subject": "Maths"},
        {"topic": "Probability",          "subject": "Maths"},
    ]},
    "NEET": {"all": [
        {"topic": "Mechanics",            "subject": "Physics"},
        {"topic": "Thermodynamics",       "subject": "Physics"},
        {"topic": "Optics",               "subject": "Physics"},
        {"topic": "Electrostatics",       "subject": "Physics"},
        {"topic": "Physical Chem",        "subject": "Chemistry"},
        {"topic": "Organic Chem",         "subject": "Chemistry"},
        {"topic": "Inorganic Chem",       "subject": "Chemistry"},
        {"topic": "Cell Biology",         "subject": "Biology"},
        {"topic": "Genetics",             "subject": "Biology"},
        {"topic": "Human Physiology",     "subject": "Biology"},
        {"topic": "Plant Physiology",     "subject": "Biology"},
        {"topic": "Ecology",              "subject": "Biology"},
    ]}
}


def should_rebalance(db, user_id: int) -> bool:
    last_plan = db.query(StudyPlan).filter_by(user_id=user_id)\
                  .order_by(StudyPlan.id.desc()).first()
    if not last_plan:
        return True

    snapshot = json.loads(last_plan.mastery_snapshot or "{}")
    current  = db.query(SyllabusProgress).filter_by(user_id=user_id).all()

    for p in current:
        old = snapshot.get(p.topic, 0.0)
        if abs(p.mastery_score - old) > 0.15:
            return True
    return False


def trigger_replan(db, user, _call_fn) -> list:
    from datetime import timedelta

    progress_rows  = db.query(SyllabusProgress).filter_by(user_id=user.id).all()
    syllabus_ctx   = build_syllabus_context(progress_rows, user.exam_target)
    exam_date      = user.exam_date or str(date.today() + timedelta(days=90))
    days_remaining = max((date.fromisoformat(exam_date) - date.today()).days, 1)

    prompt = f"""You are an expert {user.exam_target} study planner AI agent.

Student Profile:
- Exam: {user.exam_target}
- Days remaining until exam: {days_remaining}
- Daily study hours: {user.daily_hours}

Full Syllabus Status (subject | topic | status | mastery | attempts):
{syllabus_ctx}

Instructions:
1. Prioritise in_progress topics with mastery below 60% — schedule these first
2. Introduce pending topics steadily — don't front-load too many new topics
3. Schedule completed topics for light revision only once every 7 days
4. Group related subjects on same day where possible
5. Be realistic — max {user.daily_hours} hours per day

Return ONLY a valid JSON array for the next {min(days_remaining, 30)} days:
[
  {{
    "date": "YYYY-MM-DD",
    "day": "Monday",
    "topics": [
      {{
        "topic": "topic name",
        "subject": "subject name",
        "hours": 2,
        "priority": "weak area",
        "reason": "mastery only 30%, needs urgent revision"
      }}
    ]
  }}
]"""

    try:
        raw  = _call_fn(prompt)
        clean = re.sub(r"```json|```", "", raw).strip()
        plan = json.loads(clean)
    except Exception as e:
        print(f"Fallback due to Gemini Error: {e}")
        plan = [{
            "date": str(date.today()),
            "day": "Notice",
            "topics": [{
                "topic": "API Limit Reached",
                "subject": "EduMind System",
                "hours": 0,
                "priority": "Critical",
                "reason": "You have exhausted your free-tier Gemini API quota. Please wait or upgrade your API Key."
            }]
        }]

    snapshot = {p.topic: p.mastery_score for p in progress_rows}
    sp = StudyPlan(
        user_id=user.id,
        plan_json=json.dumps(plan),
        mastery_snapshot=json.dumps(snapshot)
    )
    db.add(sp); db.commit()
    return plan