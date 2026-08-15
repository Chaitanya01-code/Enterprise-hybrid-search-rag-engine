import os
import ssl
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

connect_args = {}

# Normalize connection string for SQLAlchemy + pg8000 compatibility with Neon PostgreSQL
if DATABASE_URL:
    # Convert postgres:// or postgresql:// to postgresql+pg8000://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+pg8000://", 1)
    elif DATABASE_URL.startswith("postgresql://") and "+pg8000" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

    # Strip query parameters (like ?sslmode=require&channel_binding=require) that pg8000 does not accept as kwarg
    parsed = urlparse(DATABASE_URL)
    DATABASE_URL = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))

    # Configure SSL context for Neon PostgreSQL SSL connection
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl_context"] = ssl_ctx

    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300
    )
else:
    # In-memory SQLite fallback if DATABASE_URL is missing
    engine = create_engine("sqlite:///./enterprise_rag.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
