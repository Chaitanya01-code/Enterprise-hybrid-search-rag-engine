# Backend — Enterprise Hybrid Search RAG Engine

FastAPI backend providing authentication, document management, and a Retrieval-Augmented Generation (RAG) query pipeline powered by Google Gemini.

---

## Stack

| Component | Technology |
|---|---|
| Web framework | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2 + pg8000 |
| Database | PostgreSQL (Neon / any host) — SQLite fallback |
| Embeddings | Google Gemini `gemini-embedding-2` (768-dim) |
| LLM | Google Gemini `gemini-3.7-flash` |
| Document parsing | pypdf · python-docx |
| Password hashing | bcrypt |

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py          # App factory, CORS middleware, router includes
│   ├── database.py      # Engine, session, get_db dependency
│   ├── models.py        # SQLAlchemy ORM: User, Document, DocumentChunk
│   ├── api/
│   │   ├── auth.py      # POST /signup  POST /login
│   │   ├── admin.py     # Document CRUD + upload → RAG pipeline
│   │   ├── user.py      # Read-only document list
│   │   └── query.py     # POST /query — semantic search + LLM answer
│   └── rag/
│       ├── chunks.py    # Text extraction (PDF / DOCX / TXT) + token chunking
│       └── embeddings.py# Gemini embedding generation + cosine similarity search
├── uploads/             # Persisted uploaded files (bind-mounted in Docker)
├── requirements.txt
├── Dockerfile
├── .env.example
└── README.md
```

---

## Setup — Local

### Prerequisites
- Python 3.12+
- A PostgreSQL database (Neon, Supabase, local, etc.) — or leave `DATABASE_URL` empty for SQLite
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Steps

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — fill in DATABASE_URL and GEMINI_API

# 4. Start the dev server
uvicorn app.main:app --reload --port 8000
```

- API root: **http://localhost:8000/**
- Interactive Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

---

## Setup — Docker

```bash
# From the project root
cp backend/.env.example backend/.env
# Edit backend/.env

docker compose up --build backend
```

The backend container listens on `0.0.0.0:8000` and mounts the `uploads_data` named volume at `/app/uploads`.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Recommended | _(SQLite fallback)_ | Full PostgreSQL connection string |
| `GEMINI_API` | **Yes** | — | Google Gemini API key |
| `UPLOAD_DIR` | No | `uploads` | Directory for uploaded files |

**Supported `DATABASE_URL` formats:**
```
postgresql://user:password@host/dbname
postgresql+pg8000://user:password@host/dbname
postgres://user:password@host/dbname   # auto-converted
```
SSL is configured automatically; query-string parameters (e.g. `?sslmode=require`) are stripped before passing to pg8000.

---

## API Reference

### Auth (public)

| Method | Path | Body | Response |
|---|---|---|---|
| `POST` | `/signup` | `{email, username, password, role?}` | User object |
| `POST` | `/login` | `{username?, email?, password}` | User object |

### Admin (header: `X-User-Role: admin`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/admin/upload` | Upload file (form-data: `file`, `description?`, `tags?`) |
| `GET` | `/admin/documents` | List documents (`skip`, `limit` query params) |
| `GET` | `/admin/documents/{id}` | Get document metadata |
| `GET` | `/admin/documents/{id}/download` | Download raw file |
| `PATCH` | `/admin/documents/{id}` | Update `filename`, `description`, `tags` |
| `DELETE` | `/admin/documents/{id}` | Delete document, chunks, and file from disk |

### User (header: `X-User-Role: user` or `admin`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/documents` | Read-only document list |
| `POST` | `/query` | `{question, document_id?, top_k?}` → `{answer, sources, chunks_found}` |

---

## Database Models

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `username` | String(100) | Unique |
| `email` | String(255) | Unique |
| `password` | String(255) | bcrypt hash |
| `role` | String(50) | `"user"` or `"admin"` |
| `created_at` | DateTime | |

### `documents`
| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `filename` | String | UUID-based on-disk name |
| `original_filename` | String | Original upload name |
| `content_type` | String | MIME type |
| `size` | BigInteger | Bytes |
| `description` | Text | Optional |
| `tags` | String | Optional, comma-separated |
| `file_path` | String | Absolute path on disk |
| `uploaded_at` | DateTime | |
| `updated_at` | DateTime | Auto-updated |

### `document_chunks`
| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `document_id` | Integer | FK → `documents.id` |
| `chunk_name` | String | Source document filename |
| `chunk_index` | Integer | 0-based position in document |
| `page_number` | Integer | 1-based source page |
| `chunk_text` | Text | Token window text |
| `token_count` | Integer | |
| `embedding` | Text | JSON-serialised `List[float]` (768 dims) |
| `chunk_metadata` | Text | JSON provenance dict |
| `created_at` | DateTime | |

---

## RAG Pipeline

When a document is uploaded via `POST /admin/upload`:

1. **Save to disk** — file written to `UPLOAD_DIR` under a UUID filename.
2. **DB record** — metadata inserted into `documents`.
3. **Background task** (`FastAPI.BackgroundTasks`) — the following runs after the HTTP response is sent:
   - **Text extraction** — dispatched by MIME type: PDF (pypdf, page-by-page), DOCX (python-docx), TXT/MD/CSV (UTF-8 decode).
   - **Token chunking** — 700-token windows with 100-token overlap (`chunks.py`).
   - **Embedding** — each chunk text sent to `models/gemini-embedding-2` (RETRIEVAL_DOCUMENT task). Result is a 768-dim float vector.
   - **Persist** — `DocumentChunk` rows bulk-inserted into PostgreSQL with embeddings stored as JSON strings.

When `POST /query` is called:

1. **Embed query** — question embedded with `RETRIEVAL_QUERY` task type.
2. **Cosine search** — all stored chunk embeddings loaded from DB; cosine similarity computed in pure Python; top-k returned.
3. **LLM generation** — top chunks assembled into a context prompt; `gemini-3.7-flash` generates a grounded answer.
4. **Response** — `{answer, sources[], chunks_found}` returned to the caller.

---

## Requirements

```
fastapi>=0.110.0
uvicorn>=0.30.0
sqlalchemy>=2.0.0
pg8000>=1.30.0
bcrypt>=4.0.0
python-dotenv>=1.0.0
pydantic>=2.0.0
python-multipart>=0.0.9
google-genai>=1.0.0
pypdf>=4.0.0
python-docx>=1.1.0
```
