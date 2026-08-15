from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, BigInteger
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    content_type = Column(String(200), nullable=False)
    size = Column(BigInteger, nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)
    file_path = Column(String(1000), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DocumentChunk(Base):
    """
    Stores individual text chunks produced from a Document,
    together with their Gemini embeddings (JSON-serialised float list).
    """
    __tablename__ = "document_chunks"

    id            = Column(Integer, primary_key=True, index=True)
    document_id   = Column(Integer, nullable=False, index=True)   # FK → documents.id
    chunk_name    = Column(String(500), nullable=False)           # same as parent document original_filename
    chunk_index   = Column(Integer, nullable=False)               # 0-based position within the document
    page_number   = Column(Integer, nullable=True)                # source page (1-based)
    chunk_text    = Column(Text, nullable=False)                  # the actual text window
    token_count   = Column(Integer, nullable=False, default=0)   # word-token count of this chunk
    embedding     = Column(Text, nullable=True)                  # JSON-serialised List[float]
    chunk_metadata = Column(Text, nullable=True)                 # JSON-serialised provenance dict
    created_at    = Column(DateTime, default=datetime.utcnow)
