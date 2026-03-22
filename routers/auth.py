from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from database import get_db
from models.db_models import User
from pydantic import BaseModel
import os

router = APIRouter(tags=["Auth"])
SECRET = os.getenv("SECRET_KEY", "edumind_secret_2026")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

class RegisterRequest(BaseModel):
    name:        str
    email:       str
    password:    str
    exam_target: str = "JEE"
    exam_date:   str = ""
    daily_hours: int = 6

class LoginRequest(BaseModel):
    email:    str
    password: str

def make_token(user_id: int):
    exp = datetime.utcnow() + timedelta(days=7)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET, algorithm="HS256")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token   = credentials.credentials
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        user    = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except:
        raise HTTPException(401, "Invalid or expired token")

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(
        name=req.name, email=req.email,
        hashed_password=hash_password(req.password),
        exam_target=req.exam_target,
        exam_date=req.exam_date,
        daily_hours=req.daily_hours
    )
    db.add(user); db.commit(); db.refresh(user)
    return {"token": make_token(user.id), "user": {"name": user.name, "exam": user.exam_target}}

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return {"token": make_token(user.id), "user": {"name": user.name, "exam": user.exam_target}}