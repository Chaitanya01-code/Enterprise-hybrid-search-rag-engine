import os
import uuid
from datetime import datetime
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

load_dotenv()

router = APIRouter()

# Directory where uploaded files are stored
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    content_type: str
    size: int
    description: Optional[str]
    tags: Optional[str]
    file_path: str
    uploaded_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentUpdate(BaseModel):
    filename: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    description: Optional[str] = None,
    tags: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Upload any type of document and persist its metadata to the database."""
    content = await file.read()
    file_size = len(content)

    # Generate a unique on-disk filename to avoid collisions
    ext = os.path.splitext(file.filename or "")[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    doc = models.Document(
        filename=unique_name,
        original_filename=file.filename or unique_name,
        content_type=file.content_type or "application/octet-stream",
        size=file_size,
        description=description,
        tags=tags,
        file_path=file_path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("/documents", response_model=List[DocumentOut])
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Return a paginated list of all uploaded documents."""
    return db.query(models.Document).offset(skip).limit(limit).all()


# ── View / Download ───────────────────────────────────────────────────────────

@router.get("/documents/{doc_id}", response_model=DocumentOut)
def view_document(doc_id: int, db: Session = Depends(get_db)):
    """Return metadata for a single document."""
    doc = db.get(models.Document, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


@router.get("/documents/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_db)):
    """Stream the raw file back to the caller."""
    doc = db.get(models.Document, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="File no longer exists on disk.")
    return FileResponse(
        path=doc.file_path,
        media_type=doc.content_type,
        filename=doc.original_filename,
    )


# ── Edit ──────────────────────────────────────────────────────────────────────

@router.patch("/documents/{doc_id}", response_model=DocumentOut)
def edit_document(doc_id: int, payload: DocumentUpdate, db: Session = Depends(get_db)):
    """Update filename, description, or tags of an existing document."""
    doc = db.get(models.Document, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if payload.filename is not None:
        doc.filename = payload.filename
    if payload.description is not None:
        doc.description = payload.description
    if payload.tags is not None:
        doc.tags = payload.tags

    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    return doc


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    """Remove a document's metadata from the database and its file from disk."""
    doc = db.get(models.Document, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    # Best-effort file removal; don't fail if it's already gone
    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except OSError:
        pass

    db.delete(doc)
    db.commit()
