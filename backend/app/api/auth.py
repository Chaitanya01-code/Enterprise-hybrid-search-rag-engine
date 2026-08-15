from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from ..database import get_db
from .. import models

load_dotenv()
router = APIRouter()

def hash_password(password: str) -> str:
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except Exception:
        import hashlib
        salt = hashlib.sha256(password.encode('utf-8')).hexdigest()[:16]
        hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"pbkdf2:{salt}:{hashed.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if hashed_password.startswith("pbkdf2:"):
            import hashlib
            parts = hashed_password.split(":")
            if len(parts) == 3:
                salt = parts[1]
                hash_hex = parts[2]
                check = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
                return check.hex() == hash_hex
        import bcrypt
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        import hashlib
        return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() in hashed_password

class LoginSchema(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

class signup(BaseModel):
    email: str
    username: str
    password: str

@router.post("/signup")
async def register(user: signup, db: Session = Depends(get_db)):
    if not user.username or not user.email or not user.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, and password are all required."
        )

    # Check if username or email is already registered in Neon PostgreSQL database
    existing_user = db.query(models.User).filter(
        (models.User.username == user.username) | (models.User.email == user.email)
    ).first()

    if existing_user:
        if existing_user.username == user.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already registered."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered."
            )

    # Hash password and store user in PostgreSQL database
    db_user = models.User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "status": "success",
        "message": "User registered successfully",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email
        }
    }

@router.post("/login")
async def login(user: LoginSchema, db: Session = Depends(get_db)):
    identifier = user.username or user.email
    if not identifier or not user.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide username/email and password."
        )

    # Search database for matching username or email
    db_user = db.query(models.User).filter(
        (models.User.username == identifier) | (models.User.email == identifier)
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please check your credentials or sign up."
        )

    # Verify password against database hash
    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please try again."
        )

    return {
        "status": "success",
        "message": "Login successful",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email
        }
    }
