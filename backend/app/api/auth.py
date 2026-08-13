from pydantic import BaseModel 
from fastapi import APIRouter

router = APIRouter()

class LoginSchema(BaseModel):
    username: str
    password: str

class RegisterSchema(BaseModel):
    username: str
    password: str
    
@router.post("/register")
async def register(user: RegisterSchema):
    return {
        "message": "User registered successfully",
        "data": user
    }

@router.post("/admin/login")
async def login(user: LoginSchema):
    return {
        "username": user.username,
        "password": user.password
    }

@router.post("/user/login")
async def login(user: LoginSchema):
    return {
        "username": user.username,
        "password": user.password
    }