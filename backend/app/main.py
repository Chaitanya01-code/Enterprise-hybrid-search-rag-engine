from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .api import auth
from .api import admin
from .api import user
from .database import engine, Base
from . import models

load_dotenv()

# Create tables in PostgreSQL database on application startup
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database table initialization notice: {e}")

app = FastAPI()

app.include_router(auth.router, tags=["auth"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(user.router,  prefix="/user",  tags=["user"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome to Enterprise Hybrid Search RAG Engine"}
