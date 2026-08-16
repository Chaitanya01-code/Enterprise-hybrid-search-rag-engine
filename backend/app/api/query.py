"""
POST /query  — Semantic search + Gemini LLM answer generation.

Flow:
  1. Embed the user question with Gemini (RETRIEVAL_QUERY task).
  2. Retrieve top-5 most similar chunks from document_chunks via cosine similarity.
  3. Build a context prompt from retrieved chunks.
  4. Ask Gemini (gemini-1.5-flash) to answer strictly from that context.
  5. Return the answer plus source citations.

Accessible by both 'user' and 'admin' roles.
"""

import os
from typing import Optional, List

from google import genai
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..rag.embeddings import semantic_search

router = APIRouter()

# ── Auth guard (user OR admin) ────────────────────────────────────────────────

def require_authenticated(x_user_role: str = Header(default="")):
    if x_user_role.lower() not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication required to use the RAG assistant.",
        )


# ── Schemas ───────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    document_id: Optional[int] = None   # scope search to a single document
    top_k: int = 5


class SourceCitation(BaseModel):
    chunk_name: str
    page_number: Optional[int]
    chunk_index: int
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    chunks_found: int


# ── LLM answer generation ─────────────────────────────────────────────────────

def _build_prompt(question: str, chunks: list) -> str:
    context_parts = []
    for i, c in enumerate(chunks, 1):
        context_parts.append(
            f"[Source {i}: {c['chunk_name']} | Page {c.get('page_number', 'N/A')} | Chunk #{c['chunk_index']}]\n"
            f"{c['chunk_text']}"
        )
    context = "\n\n---\n\n".join(context_parts)

    return (
        "You are an Enterprise AI assistant. Answer the user's question using ONLY the context "
        "provided below. If the answer cannot be found in the context, say: "
        "'I could not find relevant information in the uploaded documents.'\n\n"
        f"CONTEXT:\n{context}\n\n"
        f"QUESTION: {question}\n\n"
        "ANSWER:"
    )


def _gemini_answer(prompt: str) -> str:
    api_key = os.getenv("GEMINI_API")
    if not api_key:
        return "Gemini API key is not configured. Please set GEMINI_API in the backend .env file."

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-3.7-flash",
        contents=prompt,
    )

    # response.text returns Optional[str] in the new SDK (no exception on blocked responses)
    text = response.text
    if text:
        return text.strip()

    # Surface the finish reason when the model returned no text
    try:
        reasons = [str(c.finish_reason) for c in response.candidates]
        return f"The model did not return an answer (finish_reason: {', '.join(reasons)})."
    except Exception:
        return "The model did not return an answer."


# ── Query endpoint ────────────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse)
def query_documents(
    payload: QueryRequest,
    db: Session = Depends(get_db),
    _: None = Depends(require_authenticated),
):
    """
    Semantic search over all stored chunk embeddings, then generate
    a Gemini-powered answer grounded in the retrieved context.
    """
    if not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    # Step 1 — semantic retrieval
    top_chunks = semantic_search(
        db=db,
        query=payload.question,
        document_id=payload.document_id,
        top_k=payload.top_k,
    )

    if not top_chunks:
        return QueryResponse(
            answer="No document chunks are available yet. Please ask an admin to upload documents first.",
            sources=[],
            chunks_found=0,
        )

    # Step 2 — LLM answer
    prompt = _build_prompt(payload.question, top_chunks)
    try:
        answer = _gemini_answer(prompt)
    except Exception as e:
        answer = f"LLM generation error: {e}"

    # Step 3 — build citations
    sources = [
        SourceCitation(
            chunk_name=c["chunk_name"],
            page_number=c.get("page_number"),
            chunk_index=c["chunk_index"],
            score=round(c["score"], 4),
        )
        for c in top_chunks
    ]

    return QueryResponse(
        answer=answer,
        sources=sources,
        chunks_found=len(top_chunks),
    )
