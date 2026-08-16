# Enterprise Hybrid Search RAG Engine — Technical Documentation

> **Version:** 1.0  
> **Stack:** FastAPI · React 19 · Google Gemini · PostgreSQL · Docker

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Repository Structure](#3-repository-structure)
4. [Backend](#4-backend)
   - 4.1 [Application Entry Point](#41-application-entry-point)
   - 4.2 [Database Layer](#42-database-layer)
   - 4.3 [Data Models](#43-data-models)
   - 4.4 [Authentication API](#44-authentication-api)
   - 4.5 [Admin API](#45-admin-api)
   - 4.6 [User API](#46-user-api)
   - 4.7 [Query / RAG API](#47-query--rag-api)
   - 4.8 [RAG Pipeline — Document Ingestion](#48-rag-pipeline--document-ingestion)
   - 4.9 [RAG Pipeline — Query Resolution](#49-rag-pipeline--query-resolution)
   - 4.10 [Chunking Strategy](#410-chunking-strategy)
   - 4.11 [Embedding & Similarity](#411-embedding--similarity)
5. [Frontend](#5-frontend)
   - 5.1 [Application Shell](#51-application-shell)
   - 5.2 [Routing & Route Guards](#52-routing--route-guards)
   - 5.3 [Auth & Theme State](#53-auth--theme-state)
   - 5.4 [Pages](#54-pages)
   - 5.5 [API Client](#55-api-client)
6. [Docker & Containerisation](#6-docker--containerisation)
   - 6.1 [Backend Dockerfile](#61-backend-dockerfile)
   - 6.2 [Frontend Dockerfile](#62-frontend-dockerfile)
   - 6.3 [Docker Compose](#63-docker-compose)
7. [Environment Variables](#7-environment-variables)
8. [API Reference](#8-api-reference)
9. [Database Schema](#9-database-schema)
10. [Deployment](#10-deployment)
11. [Security Notes](#11-security-notes)
12. [Known Limitations & Future Work](#12-known-limitations--future-work)

---

## 1. System Overview

The **Enterprise Hybrid Search RAG Engine** is a full-stack AI platform that allows organisations to:

- **Ingest** internal documents (PDF, DOCX, TXT, CSV, Markdown) via an admin interface.
- **Index** those documents as dense vector embeddings stored in PostgreSQL.
- **Query** the knowledge base in natural language — the system retrieves the most relevant text chunks and uses Google Gemini to synthesise a grounded, cited answer.

### Primary User Roles

| Role | Capabilities |
|---|---|
| **Admin** | Upload, edit, delete, and download documents · Manage knowledge base · Use RAG chat · View document analytics |
| **User** | Browse documents (read-only) · Use RAG chat assistant |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Welcome  │  │  Login/  │  │  Admin   │  │  User  │  │
│  │  Page    │  │  Signup  │  │  Page    │  │  Chat  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                     Axios (services/api.js)              │
└─────────────────────────────┬───────────────────────────┘
                              │ HTTP / JSON
                              ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI Backend (Uvicorn)                 │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  /auth   │  │  /admin  │  │  /user   │  │ /query │  │
│  │  router  │  │  router  │  │  router  │  │ router │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  RAG Pipeline                    │    │
│  │  chunks.py ──► embeddings.py ──► DocumentChunk  │    │
│  └─────────────────────────────────────────────────┘    │
└───────────┬─────────────────────────┬───────────────────┘
            │ SQLAlchemy + pg8000      │ google-genai SDK
            ▼                          ▼
┌──────────────────┐         ┌────────────────────────┐
│   PostgreSQL DB   │         │   Google Gemini API     │
│  ┌─────────────┐ │         │  gemini-embedding-2     │
│  │   users     │ │         │  gemini-3.7-flash       │
│  │  documents  │ │         └────────────────────────┘
│  │  doc_chunks │ │
│  └─────────────┘ │
└──────────────────┘
```

### Data Flow Summary

1. **Admin uploads a document** → saved to disk → metadata stored in DB → background task extracts text, chunks it, calls Gemini Embedding API per chunk, stores vectors in `document_chunks`.
2. **User submits a question** → question embedded via Gemini → cosine similarity computed against all stored chunk vectors → top-k chunks assembled into a prompt → Gemini Flash generates answer → `{answer, sources}` returned.

---

## 3. Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application factory
│   │   ├── database.py          # DB engine, session, SQLite fallback
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── api/
│   │   │   ├── auth.py          # Signup / Login
│   │   │   ├── admin.py         # Document CRUD + upload pipeline
│   │   │   ├── user.py          # User document list
│   │   │   └── query.py         # RAG query endpoint
│   │   └── rag/
│   │       ├── __init__.py
│   │       ├── chunks.py        # Text extraction + token-window chunking
│   │       └── embeddings.py    # Embedding generation + cosine search
│   ├── uploads/                 # Runtime: uploaded files stored here
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Router, contexts, route guards
│   │   ├── App.css              # CSS design tokens + global styles
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── Welcome.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   └── UserChatPage.jsx
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   └── services/
│   │       └── api.js
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── dockerfile
│   ├── .env.example
│   └── README.md
├── docker-compose.yml
├── DOCUMENTATION.md             # ← this file
└── README.md
```

---

## 4. Backend

### 4.1 Application Entry Point

**`backend/app/main.py`**

- Loads `.env` via `python-dotenv` _before_ any app module is imported — this is critical because `database.py` reads `DATABASE_URL` at module import time.
- Creates all SQLAlchemy tables on startup via `Base.metadata.create_all()`.
- Registers four routers: `auth`, `admin` (prefix `/admin`), `user` (prefix `/user`), `query`.
- Adds `CORSMiddleware` with `allow_origins=["*"]` to permit the frontend (any origin in development; restrict in production).

### 4.2 Database Layer

**`backend/app/database.py`**

| Feature | Detail |
|---|---|
| Primary DB | PostgreSQL via SQLAlchemy + `pg8000` driver |
| SSL | Auto-configured `ssl.create_default_context()` for cloud-hosted PostgreSQL (Neon, Supabase, etc.) |
| URL normalisation | `postgres://` and `postgresql://` auto-converted to `postgresql+pg8000://`; query-string params stripped |
| Fallback | If `DATABASE_URL` is empty, falls back to `sqlite:///./enterprise_rag.db` |
| Pooling | `pool_pre_ping=True`, `pool_recycle=300` for long-lived connections |

The `get_db()` generator is a FastAPI `Depends` dependency that yields a session and closes it after each request.

### 4.3 Data Models

#### `User`  (`users` table)
```
id            INTEGER  PK
username      VARCHAR(100)  UNIQUE  NOT NULL
email         VARCHAR(255)  UNIQUE  NOT NULL
password      VARCHAR(255)  NOT NULL  (bcrypt hash)
role          VARCHAR(50)   NOT NULL  DEFAULT 'user'
created_at    DATETIME
```

#### `Document`  (`documents` table)
```
id                  INTEGER  PK
filename            VARCHAR(500)   — UUID-based on-disk name
original_filename   VARCHAR(500)   — user's original filename
content_type        VARCHAR(200)   — MIME type
size                BIGINT         — bytes
description         TEXT           — optional
tags                VARCHAR(500)   — comma-separated, optional
file_path           VARCHAR(1000)  — absolute path on disk
uploaded_at         DATETIME
updated_at          DATETIME       — auto-updated on PATCH
```

#### `DocumentChunk`  (`document_chunks` table)
```
id              INTEGER  PK
document_id     INTEGER  (FK → documents.id, indexed)
chunk_name      VARCHAR(500)   — source document filename
chunk_index     INTEGER        — 0-based position within document
page_number     INTEGER        — 1-based source page
chunk_text      TEXT           — token window text
token_count     INTEGER
embedding       TEXT           — JSON-serialised List[float] (768 dims)
chunk_metadata  TEXT           — JSON provenance dict
created_at      DATETIME
```

### 4.4 Authentication API

**`backend/app/api/auth.py`** — no auth required

#### `POST /signup`
- Validates uniqueness of `username` and `email` against the `users` table.
- Hashes password with **bcrypt** (falls back to PBKDF2-SHA256 if bcrypt fails).
- Returns the created user object (no token — auth is stateless via role headers).

#### `POST /login`
- Accepts `username` or `email` + `password`.
- Verifies bcrypt or PBKDF2 hash depending on which scheme was used at signup.
- Returns the user object including `role`.

> **Auth model:** The frontend stores the user object in `localStorage`. Each API call sends the role as `X-User-Role` header. This is a simple, stateless design suitable for internal enterprise use. For public-facing deployments, replace with JWT tokens.

### 4.5 Admin API

**`backend/app/api/admin.py`** — requires `X-User-Role: admin`

| Endpoint | Method | Description |
|---|---|---|
| `/admin/upload` | POST | Multipart file upload. Saves to `UPLOAD_DIR`, inserts `Document` row, fires background RAG pipeline. |
| `/admin/documents` | GET | Paginated list (`skip`, `limit`). |
| `/admin/documents/{id}` | GET | Single document metadata. |
| `/admin/documents/{id}/download` | GET | Streams file via `FileResponse`. |
| `/admin/documents/{id}` | PATCH | Updates `filename`, `description`, `tags`. Rejects 404 if not found. |
| `/admin/documents/{id}` | DELETE | Removes `DocumentChunk` rows, deletes file from disk, removes `Document` row. |

Upload flow detail:
1. File bytes read into memory.
2. UUID filename generated → written to `UPLOAD_DIR`.
3. `Document` row committed to DB.
4. `BackgroundTasks.add_task()` fires `_run_rag_pipeline()` with file bytes and document ID.
5. HTTP 201 response returned immediately; RAG processing continues asynchronously.

### 4.6 User API

**`backend/app/api/user.py`** — requires `X-User-Role: user` or `admin`

| Endpoint | Method | Description |
|---|---|---|
| `/user/documents` | GET | Read-only document list (same schema as admin list) |

### 4.7 Query / RAG API

**`backend/app/api/query.py`** — requires `X-User-Role: user` or `admin`

#### `POST /query`

Request body:
```json
{
  "question": "What is the refund policy?",
  "document_id": null,
  "top_k": 5
}
```

Response:
```json
{
  "answer": "According to the uploaded policy document...",
  "sources": [
    {
      "chunk_name": "refund-policy.pdf",
      "page_number": 3,
      "chunk_index": 7,
      "score": 0.8921
    }
  ],
  "chunks_found": 5
}
```

- `document_id` scopes the search to a single document (optional).
- `top_k` controls how many chunks are retrieved (default 5).
- Returns a descriptive message if no chunks are available in the DB.

### 4.8 RAG Pipeline — Document Ingestion

```
File bytes
    │
    ▼
extract_text()          ← dispatch by MIME type / extension
    │
    ├── PDF   → pypdf.PdfReader  → List[{page, text}]
    ├── DOCX  → python-docx      → [{page: 1, text: full_doc}]
    └── TXT/MD/CSV → UTF-8 decode → [{page: 1, text: content}]
    │
    ▼
chunk_pages()           ← 700-token windows, 100-token overlap
    │
    ▼
embed_texts()           ← Gemini gemini-embedding-2
    │                      RETRIEVAL_DOCUMENT task type
    │                      768-dim float vector per chunk
    ▼
bulk_save_objects()     ← DocumentChunk rows → PostgreSQL
```

The pipeline runs in a separate `BackgroundTask` with its own SQLAlchemy engine and session to avoid sharing state with the request session.

### 4.9 RAG Pipeline — Query Resolution

```
User question (string)
    │
    ▼
embed_query()           ← Gemini gemini-embedding-2
    │                      RETRIEVAL_QUERY task type → 768-dim vector
    ▼
Load all DocumentChunks with non-null embeddings
    │
    ▼
cosine_similarity()     ← pure Python, no numpy
    │                      dot(a,b) / (|a| * |b|)
    ▼
Sort descending → top_k chunks
    │
    ▼
_build_prompt()         ← system prompt + context blocks + question
    │
    ▼
gemini-3.7-flash        ← generate_content()
    │
    ▼
{answer, sources, chunks_found}
```

### 4.10 Chunking Strategy

File: **`backend/app/rag/chunks.py`**

| Parameter | Value | Rationale |
|---|---|---|
| `TARGET_TOKENS` | 700 | Fits well within Gemini's embedding context window; gives dense, meaningful chunks |
| `OVERLAP_TOKENS` | 100 | Preserves sentence continuity at chunk boundaries |
| Tokeniser | Whitespace regex (`\S+`) | Zero-dependency; good enough for embedding purposes |
| Page preservation | Yes | `page_number` tracked per chunk; cited in query responses |

Chunks are produced per-page for PDFs (preserving page numbers) and as a single logical page for DOCX and plain-text files.

### 4.11 Embedding & Similarity

File: **`backend/app/rag/embeddings.py`**

| Item | Detail |
|---|---|
| Model | `models/gemini-embedding-2` |
| Dimensions | 768 |
| Document task type | `RETRIEVAL_DOCUMENT` |
| Query task type | `RETRIEVAL_QUERY` |
| Storage format | `json.dumps(List[float])` in a `TEXT` column |
| Similarity metric | Cosine similarity (pure Python) |
| Fallback | If embedding fails for a chunk, the chunk is saved without an embedding (still searchable by text in future) |

---

## 5. Frontend

### 5.1 Application Shell

**`frontend/src/App.jsx`**

- Wraps the entire application in `UserContext.Provider` and `ThemeContext.Provider`.
- Uses `BrowserRouter` from React Router 7.
- `Layout` component hides the `Navbar` on `/admin` and `/user` routes (those pages have their own headers).

### 5.2 Routing & Route Guards

| Path | Guard | Component |
|---|---|---|
| `/` | None | `Welcome` |
| `/login` | None | `Login` |
| `/signup` | None | `Signup` |
| `/admin` | `AdminRoute` (must be admin) | `AdminPage` |
| `/user` | `UserRoute` (must be user, redirects admin to `/admin`) | `UserChatPage` |

`AdminRoute`: redirects to `/login` if not authenticated; to `/` if authenticated but not admin.  
`UserRoute`: redirects to `/login` if not authenticated; to `/admin` if role is admin.

### 5.3 Auth & Theme State

Both pieces of state are initialised from `localStorage` on first render and synced back on every change.

**User state** — stored as JSON under the key `"user"`:
```json
{ "id": 1, "username": "alice", "email": "alice@example.com", "role": "admin" }
```

**Theme state** — stored as `"dark"` or `"light"` under the key `"theme"`.

Contexts exported from `App.jsx`:
- `useUser()` → `{ user, setUser }`
- `useTheme()` → `{ dark, toggle }`

### 5.4 Pages

#### Welcome (`/`)
- Public landing page.
- **Test Connection** button: calls `GET /` via `checkBackendHealth()` and renders an inline status toast.
- **Live AI Console**: form that calls `POST /query` with `X-User-Role: user` and renders the answer + source citations with response latency.
- Footer CTAs link to `/signup` and `/login`.

#### Login (`/login`)
- Accepts username or email + password.
- Calls `POST /login`; on success stores user in `UserContext` and navigates to `/admin` or `/user` based on role.

#### Signup (`/signup`)
- Collects username, email, password, and role (`user` / `admin`).
- Calls `POST /signup`; on success stores user and navigates to the appropriate dashboard.

#### AdminPage (`/admin`)
Three-column resizable layout toggled via the toolbar:

| Panel | Default Visibility | Description |
|---|---|---|
| Document List (left) | Visible | Paginated table of documents. Each row expands to show description, tags, size, date. Row actions: Edit (modal), Delete (confirm modal), Download. |
| RAG Chat (right top) | Visible | Full conversation interface. Sends `POST /query` with `X-User-Role: admin`. Supports markdown rendering (headings, bold, code blocks, lists). |
| Analysis (right bottom) | Toggled | Document statistics: total count, total size, file type breakdown, largest/newest documents. |

Upload panel: drag-or-click file picker with optional description and tags. On submit, calls `POST /admin/upload` and refreshes the document list.

Confirm modal: soft-delete confirmation step before `DELETE /admin/documents/{id}`.

Edit modal: inline form to update `filename`, `description`, `tags` via `PATCH /admin/documents/{id}`.

#### UserChatPage (`/user`)
- Full-screen chat UI.
- Greeting detection: `/^(hi+|hello+|hey+|howdy|greetings|sup)[!?.]*$/i` — handled locally without an API call.
- Sends `POST /query` with `X-User-Role: user`.
- Thinking indicator (three animated dots) while awaiting response.
- Enter to send, Shift+Enter for newline.

### 5.5 API Client

**`frontend/src/services/api.js`**

Base URL:
```js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
```

All functions return a uniform envelope:
```js
{ success: true,  data: <response.data> }
{ success: false, error: <error message string> }
```

| Function | Method | Path | Role Header |
|---|---|---|---|
| `loginUser` | POST | `/login` | — |
| `signupUser` | POST | `/signup` | — |
| `checkBackendHealth` | GET | `/` | — |
| `listDocuments` | GET | `/admin/documents` | `admin` |
| `uploadDocument` | POST | `/admin/upload` | `admin` |
| `editDocument` | PATCH | `/admin/documents/{id}` | `admin` |
| `deleteDocument` | DELETE | `/admin/documents/{id}` | `admin` |
| `downloadDocumentUrl` | — | `/admin/documents/{id}/download` | `admin` |
| `listDocumentsUser` | GET | `/user/documents` | `user` |
| `sendQuery` | POST | `/query` | caller-supplied |

---

## 6. Docker & Containerisation

### 6.1 Backend Dockerfile

**`backend/Dockerfile`** — single stage

```
python:3.12-slim
  ↓ apt-get gcc libffi-dev  (bcrypt native build dependency)
  ↓ pip install -r requirements.txt
  ↓ COPY app/
  ↓ VOLUME ["/app/uploads"]
  ↓ CMD uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
```

`--workers 1` is intentional — `BackgroundTasks` runs in the same process; multiple workers would each spin up isolated event loops and could result in duplicate background jobs.

### 6.2 Frontend Dockerfile

**`frontend/dockerfile`** — multi-stage

**Stage 1 — builder** (`node:22-alpine`)
- `npm ci` (clean install from lockfile)
- `ARG VITE_BACKEND_URL` injected as a build argument → exposed as `ENV` → read by Vite as `import.meta.env.VITE_BACKEND_URL`
- `npm run build` → `dist/`

**Stage 2 — serve** (`nginx:1.27-alpine`)
- Copies `dist/` to `/usr/share/nginx/html`
- Installs a minimal nginx config:
  - Listens on port 80
  - `try_files $uri $uri/ /index.html` — SPA client-side routing fallback
  - gzip compression for text/CSS/JS/JSON/SVG

### 6.3 Docker Compose

**`docker-compose.yml`**

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    volumes: [uploads_data:/app/uploads]
    healthcheck: GET http://localhost:8000/

  frontend:
    build: ./frontend
    build args: VITE_BACKEND_URL=http://localhost:8000
    ports: ["80:80"]
    depends_on: backend (healthy)

volumes:
  uploads_data:        # named volume — survives container restarts
```

---

## 7. Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Recommended | PostgreSQL connection string. Falls back to `sqlite:///./enterprise_rag.db` if unset. |
| `GEMINI_API` | **Yes** | Google Gemini API key. Needed for both embedding and LLM generation. Get one at https://aistudio.google.com/app/apikey |
| `UPLOAD_DIR` | No | File storage directory inside the container. Defaults to `uploads`. Must match the volume mount path. |

Supported `DATABASE_URL` schemes:
- `postgresql://user:pass@host/db`
- `postgresql+pg8000://user:pass@host/db`
- `postgres://user:pass@host/db` (auto-converted)

SSL is always enabled for PostgreSQL; `?sslmode=require` query params are stripped automatically.

### Frontend

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:8000` | Backend base URL. Set as a Docker build argument or in `frontend/.env` for local dev. |

---

## 8. API Reference

### Public Endpoints

#### `POST /signup`
```
Body:  { email: string, username: string, password: string, role?: "user"|"admin" }
200:   { status, message, user: { id, username, email, role } }
400:   { detail: "Username/email already registered" }
```

#### `POST /login`
```
Body:  { username?: string, email?: string, password: string }
200:   { status, message, user: { id, username, email, role } }
400:   { detail: "Please provide username/email and password" }
401:   { detail: "Invalid password" }
404:   { detail: "User not found" }
```

#### `GET /`
```
200:   { message: "Welcome to Enterprise Hybrid Search RAG Engine" }
```

### Admin Endpoints (`X-User-Role: admin`)

#### `POST /admin/upload`
```
Content-Type: multipart/form-data
Fields: file (required), description (optional), tags (optional)
201:   DocumentOut schema
403:   Admin access required
```

#### `GET /admin/documents`
```
Query: skip=0, limit=50
200:   DocumentOut[]
```

#### `GET /admin/documents/{id}`
```
200:   DocumentOut
404:   Document not found
```

#### `GET /admin/documents/{id}/download`
```
200:   Binary file stream
404:   Document not found
410:   File no longer on disk
```

#### `PATCH /admin/documents/{id}`
```
Body:  { filename?, description?, tags? }
200:   DocumentOut
404:   Document not found
```

#### `DELETE /admin/documents/{id}`
```
204:   No content
404:   Document not found
```

### User Endpoints (`X-User-Role: user` or `admin`)

#### `GET /user/documents`
```
Query: skip=0, limit=50
200:   DocumentOut[]
```

#### `POST /query`
```
Body:
  {
    "question": string,       // required
    "document_id": int|null,  // optional: scope to one document
    "top_k": int              // optional, default 5
  }

200:
  {
    "answer": string,
    "sources": [
      {
        "chunk_name": string,
        "page_number": int|null,
        "chunk_index": int,
        "score": float        // 0.0 – 1.0 cosine similarity
      }
    ],
    "chunks_found": int
  }

400:   Question cannot be empty
403:   Authentication required
```

---

## 9. Database Schema

### Entity Relationship

```
users
  id PK
  username (unique)
  email (unique)
  password
  role

documents
  id PK
  filename
  original_filename
  content_type
  size
  description
  tags
  file_path
  uploaded_at
  updated_at

document_chunks
  id PK
  document_id  ──► documents.id
  chunk_name
  chunk_index
  page_number
  chunk_text
  token_count
  embedding         (JSON float list, 768 dims)
  chunk_metadata    (JSON dict)
  created_at
```

There is no enforced foreign-key constraint between `document_chunks.document_id` and `documents.id` at the SQLAlchemy level (to keep the schema portable between PostgreSQL and SQLite). The admin DELETE endpoint manually deletes chunks before deleting the parent document.

---

## 10. Deployment

### Local Development

```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill DATABASE_URL + GEMINI_API
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev            # http://localhost:5173
```

### Docker (Development / Staging)

```bash
cp backend/.env.example backend/.env
# fill in DATABASE_URL and GEMINI_API

docker compose up --build
# Frontend: http://localhost
# Backend:  http://localhost:8000
```

### Production Checklist

| Item | Action |
|---|---|
| Backend URL | Set `VITE_BACKEND_URL` in `docker-compose.yml` to the public backend domain/IP before building |
| CORS | Restrict `allow_origins` in `main.py` to your frontend domain |
| Auth | Replace role-header auth with JWT tokens for public-facing deployments |
| HTTPS | Place an SSL-terminating reverse proxy (Nginx, Traefik, Caddy) in front of both services |
| Uploads volume | Mount `uploads_data` to a persistent storage path or object storage (S3, GCS) |
| Database | Use a managed PostgreSQL service (Neon, Supabase, RDS) with connection pooling |
| Gemini quota | Monitor API usage; consider batching embedding calls for large document sets |

---

## 11. Security Notes

| Area | Current Behaviour | Production Recommendation |
|---|---|---|
| Authentication | `X-User-Role` header — trust-based | Replace with signed JWT / session tokens |
| Password hashing | bcrypt with auto-generated salt | Adequate — no change needed |
| CORS | `allow_origins=["*"]` | Restrict to frontend origin |
| SSL (DB) | `CERT_NONE` (no cert verification) | Use a CA-verified certificate in production |
| File uploads | No MIME validation beyond file extension | Validate content against declared MIME type; set max file size |
| Secrets | `.env` file | Use a secrets manager (AWS Secrets Manager, Vault) in production |

---

## 12. Known Limitations & Future Work

| # | Limitation | Suggested Improvement |
|---|---|---|
| 1 | Cosine search loads all chunk embeddings into Python memory | Migrate to pgvector extension for in-database ANN search |
| 2 | Single Uvicorn worker | Use Gunicorn with multiple workers + Redis for background task queue (Celery / RQ) |
| 3 | No JWT auth | Implement OAuth2 / JWT for stateless, verifiable auth |
| 4 | No file size / type validation on upload | Add content-type sniffing and configurable max upload size |
| 5 | Embeddings stored as JSON strings | Store as `vector(768)` with pgvector for efficient similarity queries |
| 6 | No pagination on `/query` results | Expose `offset` / `limit` on the query endpoint |
| 7 | `allow_origins=["*"]` | Restrict CORS to known frontend origins |
| 8 | Single `.env` file | Support multiple environments (dev / staging / prod) via separate env files |
| 9 | No audit logging | Log admin actions (upload, delete, edit) with timestamps and user IDs |
| 10 | Text chunking ignores document structure | Use structure-aware chunking (section headings, tables) for better retrieval |
