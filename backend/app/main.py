from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from .api import auth
from .api.admin import upload
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
app.include_router(upload.router, prefix="/admin", tags=["admin"])

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
