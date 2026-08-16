"""
Embedding generation using the Google Gemini API
and persistence of document chunks + embeddings to PostgreSQL.

Model used: gemini-embedding-004 (768-dim, free-tier)
SDK: google-genai (replaces the deprecated google-generativeai package)
"""

import os
import json
from typing import Dict, Any, List, Optional

from google import genai
from google.genai import types as genai_types
from sqlalchemy.orm import Session

from ..models import DocumentChunk

# ── Constants ─────────────────────────────────────────────────────────────────

# NOTE: Do NOT read GEMINI_API at module level — dotenv has not yet been loaded
# when this module is first imported. Always call os.getenv() at function call time.
EMBED_MODEL      = "models/gemini-embedding-2"
EMBED_TASK_DOC   = "RETRIEVAL_DOCUMENT"
EMBED_TASK_QUERY = "RETRIEVAL_QUERY"


# ── Client factory ────────────────────────────────────────────────────────────

def _get_client() -> genai.Client:
    """Return a configured genai.Client. Raises if the API key is missing."""
    key = os.getenv("GEMINI_API")  # read at call time so dotenv has already run
    if not key:
        raise RuntimeError("GEMINI_API environment variable is not set.")
    return genai.Client(api_key=key)


# ── Embedding generation ──────────────────────────────────────────────────────

def embed_texts(texts: List[str], task_type: str = EMBED_TASK_DOC) -> List[List[float]]:
    """
    Generate embeddings for a list of texts using Gemini.
    Returns a parallel list of float vectors.
    """
    client = _get_client()
    vectors: List[List[float]] = []

    for text in texts:
        response = client.models.embed_content(
            model=EMBED_MODEL,
            contents=text,
            config=genai_types.EmbedContentConfig(task_type=task_type),
        )
        # response.embeddings is a list[ContentEmbedding]; each has a .values field
        if not response.embeddings:
            raise RuntimeError(f"Gemini returned no embeddings for text: {text[:60]!r}")
        vectors.append(list(response.embeddings[0].values))

    return vectors


def embed_query(query: str) -> List[float]:
    """Embed a single user query string with the RETRIEVAL_QUERY task type."""
    client = _get_client()
    response = client.models.embed_content(
        model=EMBED_MODEL,
        contents=query,
        config=genai_types.EmbedContentConfig(task_type=EMBED_TASK_QUERY),
    )
    if not response.embeddings:
        raise RuntimeError("Gemini returned no embeddings for the query.")
    return list(response.embeddings[0].values)


# ── Cosine similarity (pure Python, no numpy required) ───────────────────────

def cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * x for x in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ── Save chunks + embeddings to DB ───────────────────────────────────────────

def save_chunks_with_embeddings(
    db: Session,
    document_id: int,
    document_name: str,
    chunks: List[Dict[str, Any]],
) -> int:
    """
    Given a list of chunk dicts (output of chunks.build_chunks),
    generate embeddings for each chunk and persist everything to
    the document_chunks table.

    Returns the number of chunks saved.
    """
    if not chunks:
        return 0

    texts = [c["chunk_text"] for c in chunks]
    try:
        vectors = embed_texts(texts, task_type=EMBED_TASK_DOC)
    except Exception as e:
        print(f"[embeddings] Embedding generation failed: {e}")
        # Save chunks without embeddings so document is still searchable via text
        vectors = [None] * len(chunks)

    rows = []
    for chunk, vector in zip(chunks, vectors):
        emb_json = json.dumps(vector) if vector is not None else None
        row = DocumentChunk(
            document_id=document_id,
            chunk_name=document_name,
            chunk_index=chunk["chunk_index"],
            page_number=chunk["page_number"],
            chunk_text=chunk["chunk_text"],
            token_count=chunk["token_count"],
            embedding=emb_json,
            chunk_metadata=json.dumps(chunk["metadata"]),
        )
        rows.append(row)

    db.bulk_save_objects(rows)
    db.commit()
    return len(rows)


# ── Semantic search ───────────────────────────────────────────────────────────

def semantic_search(
    db: Session,
    query: str,
    document_id: Optional[int] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Embed the query, retrieve all stored chunk embeddings, rank by cosine
    similarity and return the top-k most relevant chunks.

    If document_id is provided, search only within that document's chunks.
    """
    try:
        q_vector = embed_query(query)
    except Exception as e:
        print(f"[embeddings] Query embedding failed: {e}")
        return []

    q = db.query(DocumentChunk).filter(DocumentChunk.embedding.isnot(None))
    if document_id is not None:
        q = q.filter(DocumentChunk.document_id == document_id)

    results = []
    for chunk in q.all():
        try:
            vec = json.loads(chunk.embedding)
            score = cosine_similarity(q_vector, vec)
            results.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "chunk_name": chunk.chunk_name,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "chunk_text": chunk.chunk_text,
                "score": score,
            })
        except Exception:
            continue

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]
