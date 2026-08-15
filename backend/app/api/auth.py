from typing import Optional
from pydantic import BaseModel 
from fastapi import APIRouter, Query, Depends, HTTPException
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

class LoginSchema(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class signup(BaseModel):
    email: str
    username: str
    password: str
    
@router.post("/signup")
async def register(user: signup):
    return {"status": "success", "message": "User registered successfully", "user": user.username}

@router.post("/login")
async def login(user: LoginSchema):
    return {"status": "success", "message": "Login successful", "user": user.username}
