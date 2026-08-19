import os
import uuid
from datetime import datetime
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, BackgroundTasks, Depends, File, Header, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..rag.chunks import build_chunks
from ..rag.embeddings import save_chunks_with_embeddings


def require_admin(x_user_role: str = Header(default="")):
    if x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. You do not have permission to access this resource.",
        )

load_dotenv()

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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


def _run_rag_pipeline(
    file_bytes: bytes,
    content_type: str,
    original_filename: str,
    document_id: int,
    db_url: str,
):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import ssl

    try:
        connect_args = {}
        url = db_url
        if "postgresql" in url:
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE
            connect_args["ssl_context"] = ssl_ctx

        bg_engine = create_engine(url, connect_args=connect_args, pool_pre_ping=True)
        BgSession = sessionmaker(autocommit=False, autoflush=False, bind=bg_engine)
        db = BgSession()

        try:
            chunks = build_chunks(file_bytes, content_type, original_filename, document_id)
            if chunks:
                n = save_chunks_with_embeddings(db, document_id, original_filename, chunks)
                print(f"[RAG] Saved {n} chunks for document {document_id} ({original_filename})")
            else:
                print(f"[RAG] No text extracted from document {document_id} ({original_filename})")
        finally:
            db.close()
            bg_engine.dispose()

    except Exception as e:
        print(f"[RAG] Pipeline error for document {document_id}: {e}")


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    tags: Optional[str] = None,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    content = await file.read()
    file_size = len(content)

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

    from ..database import DATABASE_URL as _db_url
    background_tasks.add_task(
        _run_rag_pipeline,
        file_bytes=content,
        content_type=file.content_type or "application/octet-stream",
        original_filename=file.filename or unique_name,
        document_id=doc.id,
        db_url=_db_url,
    )

    return doc


@router.get("/documents", response_model=List[DocumentOut])
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: None = Depends(require_admin),
):
    return db.query(models.Document).offset(skip).limit(limit).all()


@router.get("/documents/{doc_id}", response_model=DocumentOut)
def view_document(doc_id: int, db: Session = Depends(get_db), _: None = Depends(require_admin)):
    doc = db.get(models.Document, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


@router.get("/documents/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_db), _: None = Depends(require_admin)):
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


@router.patch("/documents/{doc_id}", response_model=DocumentOut)
def edit_document(doc_id: int, payload: DocumentUpdate, db: Session = Depends(get_db), _: None = Depends(require_admin)):
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


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, db: Session = Depends(get_db), _: None = Depends(require_admin)):
    doc = db.get(models.Document, doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    db.query(models.DocumentChunk).filter(models.DocumentChunk.document_id == doc_id).delete()

    try:
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except OSError:
        pass

    db.delete(doc)
    db.commit()
