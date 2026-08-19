import re
from typing import List, Dict, Any

TARGET_TOKENS = 700
OVERLAP_TOKENS = 100


def _tokenise(text: str) -> List[str]:
    return re.findall(r'\S+', text)
    

def _detokenise(tokens: List[str]) -> str:
    return " ".join(tokens)


def extract_text_from_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
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
    try:
        text = file_bytes.decode("utf-8", errors="ignore")
        return [{"page": 1, "text": text}] if text.strip() else []
    except Exception as e:
        print(f"[chunks] TXT extraction error: {e}")
        return []


def extract_text(file_bytes: bytes, content_type: str, filename: str) -> List[Dict[str, Any]]:
    ct = (content_type or "").lower()
    fname = (filename or "").lower()

    if "pdf" in ct or fname.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if "word" in ct or "docx" in ct or fname.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    if "text" in ct or fname.endswith((".txt", ".md", ".csv", ".log")):
        return extract_text_from_txt(file_bytes)

    try:
        text = file_bytes.decode("utf-8", errors="ignore")
        if text.strip():
            return [{"page": 1, "text": text}]
    except Exception:
        pass
    return []


def chunk_pages(
    pages: List[Dict[str, Any]],
    document_name: str,
    document_id: int,
    target: int = TARGET_TOKENS,
    overlap: int = OVERLAP_TOKENS,
) -> List[Dict[str, Any]]:
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
    pages = extract_text(file_bytes, content_type, filename)
    if not pages:
        return []
    return chunk_pages(pages, filename, document_id)
