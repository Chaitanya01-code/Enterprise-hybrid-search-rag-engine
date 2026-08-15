from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter()


# ── User guard ────────────────────────────────────────────────────────────────

def require_user(x_user_role: str = Header(default="")):
    """Dependency that allows any authenticated user (role 'user' or 'admin')."""
    if x_user_role.lower() not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication required. Please log in to access this resource.",
        )


# ── Schema ────────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    filename: str
    original_filename: str
    content_type: str
    size: int
    description: Optional[str]
    tags: Optional[str]
    uploaded_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Read-only document list ───────────────────────────────────────────────────

@router.get("/documents", response_model=List[DocumentOut])
def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: None = Depends(require_user),
):
    """Return a paginated list of documents (read-only, available to all logged-in users)."""
    return db.query(models.Document).offset(skip).limit(limit).all()
