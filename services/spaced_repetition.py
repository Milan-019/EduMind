from datetime import date, timedelta
from models.db_models import SpacedRepetitionCard
def sm2_update(card: SpacedRepetitionCard, quality: int) -> SpacedRepetitionCard:
    """
    SM-2 algorithm. quality is 0-5:
    5 = perfect, 4 = correct with hesitation,
    3 = correct with difficulty, 2 = incorrect easy recall,
    1 = incorrect, 0 = blackout
    """
    if quality >= 3:
        if card.repetitions == 0:
            card.interval = 1
        elif card.repetitions == 1:
            card.interval = 6
        else:
            card.interval = round(card.interval * card.easiness)
        card.repetitions += 1
    else:
        card.repetitions = 0
        card.interval    = 1
    card.easiness = max(1.3, card.easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    card.last_quality = quality
    card.next_review  = str(date.today() + timedelta(days=card.interval))
    return card
def get_due_cards(db, user_id: int) -> list:
    today = str(date.today())
    return db.query(SpacedRepetitionCard).filter(
        SpacedRepetitionCard.user_id == user_id,
        SpacedRepetitionCard.next_review <= today
    ).all()
def create_or_get_card(db, user_id: int, topic: str, subject: str) -> SpacedRepetitionCard:
    card = db.query(SpacedRepetitionCard).filter_by(
        user_id=user_id, topic=topic
    ).first()
    if not card:
        card = SpacedRepetitionCard(
            user_id=user_id, topic=topic, subject=subject,
            easiness=2.5, interval=1, repetitions=0,
            next_review=str(date.today())
        )
        db.add(card); db.commit(); db.refresh(card)
    return card