from collections import defaultdict
def compute_analytics(results) -> dict:
    if not results:
        return {}
    total   = len(results)
    correct = sum(1 for r in results if r.correct)
    by_topic = defaultdict(lambda: {"correct": 0, "total": 0})
    for r in results:
        by_topic[r.topic]["total"] += 1
        if r.correct:
            by_topic[r.topic]["correct"] += 1
    scores = {
        t: round(v["correct"] / v["total"] * 100, 1)
        for t, v in by_topic.items()
    }
    acc = round(correct / total * 100, 1)
    pct = ("95-99" if acc >= 85 else "80-94" if acc >= 70 else
           "60-79" if acc >= 55 else "40-59" if acc >= 40 else "Below 40")
    return {
        "overall_accuracy":     acc,
        "total_attempted":      total,
        "topic_scores":         scores,
        "weak_areas":           sorted(scores, key=scores.get)[:3],
        "strong_areas":         sorted(scores, key=scores.get, reverse=True)[:2],
        "predicted_percentile": pct,
    }
def update_syllabus_progress(db, user_id, topic, subject, is_correct):
    from models.db_models import SyllabusProgress
    from datetime import date
    progress = db.query(SyllabusProgress).filter_by(
        user_id=user_id, topic=topic
    ).first()
    if not progress:
        progress = SyllabusProgress(
            user_id=user_id, topic=topic,
            subject=subject, status="pending",
            mastery_score=0.0, times_attempted=0
        )
        db.add(progress)
    latest  = 1.0 if is_correct else 0.0
    progress.mastery_score   = round((progress.mastery_score * 0.6) + (latest * 0.4), 3)
    progress.times_attempted += 1
    progress.last_studied    = str(date.today())
    if progress.mastery_score >= 0.7 and progress.times_attempted >= 3:
        progress.status = "completed"
    elif progress.times_attempted >= 1:
        progress.status = "in_progress"
    db.commit()