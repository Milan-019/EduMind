from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String)
    email           = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    exam_target     = Column(String, default="JEE")
    exam_date       = Column(String, nullable=True)
    daily_hours     = Column(Integer, default=6)
    created_at      = Column(DateTime, default=datetime.utcnow)

    results         = relationship("QuizResult", back_populates="user")
    progress        = relationship("SyllabusProgress", back_populates="user")
    plans           = relationship("StudyPlan", back_populates="user")
    sr_cards        = relationship("SpacedRepetitionCard", back_populates="user")


class QuizResult(Base):
    __tablename__ = "quiz_results"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    topic      = Column(String)
    subject    = Column(String)
    correct    = Column(Boolean)
    time_sec   = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user       = relationship("User", back_populates="results")


class SyllabusProgress(Base):
    __tablename__ = "syllabus_progress"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"))
    topic          = Column(String)
    subject        = Column(String)
    status         = Column(String, default="pending")   # pending / in_progress / completed
    mastery_score  = Column(Float, default=0.0)
    times_attempted = Column(Integer, default=0)
    last_studied   = Column(String, nullable=True)
    user           = relationship("User", back_populates="progress")


class StudyPlan(Base):
    __tablename__ = "study_plans"
    id               = Column(Integer, primary_key=True)
    user_id          = Column(Integer, ForeignKey("users.id"))
    plan_json        = Column(Text)
    mastery_snapshot = Column(Text, nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)
    user             = relationship("User", back_populates="plans")


class SpacedRepetitionCard(Base):
    __tablename__ = "sr_cards"
    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"))
    topic          = Column(String)
    subject        = Column(String)
    easiness       = Column(Float, default=2.5)     # SM-2 easiness factor
    interval       = Column(Integer, default=1)     # days until next review
    repetitions    = Column(Integer, default=0)     # times reviewed
    next_review    = Column(String)                 # date string YYYY-MM-DD
    last_quality   = Column(Integer, default=0)     # 0-5 last response quality
    created_at     = Column(DateTime, default=datetime.utcnow)
    user           = relationship("User", back_populates="sr_cards")