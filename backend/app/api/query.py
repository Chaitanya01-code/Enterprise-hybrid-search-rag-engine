import os
from typing import Optional, List

from google import genai
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..rag.embeddings import semantic_search

router = APIRouter()


def require_authenticated(x_user_role: str = Header(default="")):
    if x_user_role.lower() not in ("user", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authentication required to use the RAG assistant.",
        )


class QueryRequest(BaseModel):
    question: str
    document_id: Optional[int] = None
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

    text = response.text
    if text:
        return text.strip()

    try:
        reasons = [str(c.finish_reason) for c in response.candidates]
        return f"The model did not return an answer (finish_reason: {', '.join(reasons)})."
    except Exception:
        return "The model did not return an answer."


@router.post("/query", response_model=QueryResponse)
def query_documents(
    payload: QueryRequest,
    db: Session = Depends(get_db),
    _: None = Depends(require_authenticated),
):
    if not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

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

    prompt = _build_prompt(payload.question, top_chunks)
    try:
        answer = _gemini_answer(prompt)
    except Exception as e:
        answer = f"LLM generation error: {e}"

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
