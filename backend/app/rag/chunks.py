"""
Token-based document chunker.

Strategy:
  - Split extracted text into tokens using a simple whitespace/punctuation
    splitter (no external tokenizer dependency).
  - Produce overlapping windows of TARGET_TOKENS tokens with OVERLAP_TOKENS
    overlap between consecutive chunks.
  - Attach per-chunk metadata: page number (if available), chunk index,
    token count, and source document name.
"""

import re
from typing import List, Dict, Any

TARGET_TOKENS = 700   # desired chunk size in tokens
OVERLAP_TOKENS = 100  # token overlap between consecutive chunks


# ── Simple whitespace tokeniser ──────────────────────────────────────────────

def _tokenise(text: str) -> List[str]:
    """Split text into word-level tokens (punctuation attached to words)."""
    return re.findall(r'\S+', text)


def _detokenise(tokens: List[str]) -> str:
    return " ".join(tokens)


# ── Text extraction helpers ───────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extract text page-by-page from a PDF.
    Returns a list of {page: int, text: str} dicts.
    """
    try:
        import pypdf
        import io
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages = []
        for i, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page": i, "text": text})
        return pages
    except Exception as e:
        print(f"[chunks] PDF extraction error: {e}")
        return []


def extract_text_from_docx(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text from a .docx file as a single logical page."""
    try:
        import docx
        import io
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return [{"page": 1, "text": full_text}] if full_text else []
    except Exception as e:
        print(f"[chunks] DOCX extraction error: {e}")
        return []


def extract_text_from_txt(file_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract text from plain-text file."""
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
        return [{"page": 1, "text": text}] if text.strip() else []
    except Exception as e:
        print(f"[chunks] TXT extraction error: {e}")
        return []


def extract_text(file_bytes: bytes, content_type: str, filename: str) -> List[Dict[str, Any]]:
    """
    Dispatch text extraction based on content_type / filename extension.
    Returns list of {page, text} dicts.
    """
    ct = (content_type or "").lower()
    fname = (filename or "").lower()

    if "pdf" in ct or fname.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if "word" in ct or "docx" in ct or fname.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    if "text" in ct or fname.endswith((".txt", ".md", ".csv", ".log")):
        return extract_text_from_txt(file_bytes)

    # Fallback: try plain-text decode
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
        if text.strip():
            return [{"page": 1, "text": text}]
    except Exception:
        pass
    return []


# ── Core chunking logic ───────────────────────────────────────────────────────

def chunk_pages(
    pages: List[Dict[str, Any]],
    document_name: str,
    document_id: int,
    target: int = TARGET_TOKENS,
    overlap: int = OVERLAP_TOKENS,
) -> List[Dict[str, Any]]:
    """
    Given a list of {page, text} dicts, produce overlapping token windows.

    Each returned chunk dict:
        chunk_index   int   — zero-based sequential index across all chunks
        page_number   int   — source page number
        chunk_text    str   — chunk text
        token_count   int   — token count of this chunk
        metadata      dict  — extra provenance fields
    """
    chunks: List[Dict[str, Any]] = []
    chunk_index = 0

    for page_info in pages:
        page_num = page_info["page"]
        tokens = _tokenise(page_info["text"])

        if not tokens:
            continue

        step = max(1, target - overlap)
        pos = 0

        while pos < len(tokens):
            window = tokens[pos: pos + target]
            text = _detokenise(window)
            token_count = len(window)

            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_num,
                "chunk_text": text,
                "token_count": token_count,
                "metadata": {
                    "source_document": document_name,
                    "document_id": document_id,
                    "page": page_num,
                    "chunk_index": chunk_index,
                    "token_count": token_count,
                },
            })
            chunk_index += 1

            if pos + target >= len(tokens):
                break
            pos += step

    return chunks


def build_chunks(
    file_bytes: bytes,
    content_type: str,
    filename: str,
    document_id: int,
) -> List[Dict[str, Any]]:
    """
    Full pipeline: extract text → chunk → return list of chunk dicts.
    Called by the upload handler after saving the file to disk.
    """
    pages = extract_text(file_bytes, content_type, filename)
    if not pages:
        return []
    return chunk_pages(pages, filename, document_id)
