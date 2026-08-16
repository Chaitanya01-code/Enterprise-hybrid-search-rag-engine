# Enterprise Hybrid Search RAG Engine

An AI-integrated enterprise platform that connects clients and workers directly to company knowledge bases using **semantic vector search** and **Gemini LLM generation**. Admins upload documents; users ask natural-language questions and receive grounded, cited answers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI · Uvicorn · Python 3.12 |
| Database | PostgreSQL (Neon / any host) · SQLAlchemy + pg8000 |
| Embeddings & LLM | Google Gemini API (`gemini-embedding-2`, `gemini-3.7-flash`) |
| Document parsing | pypdf · python-docx |
| Frontend | React 19 · Vite 8 · React Router 7 |
| HTTP client | Axios |
| Containerisation | Docker · Docker Compose |

---

## Project Layout

```
.
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # User, Document, DocumentChunk ORM models
│   │   ├── api/
│   │   │   ├── auth.py      # POST /signup  POST /login
│   │   │   ├── admin.py     # Upload, list, edit, delete documents
│   │   │   ├── user.py      # Read-only document list for users
│   │   │   └── query.py     # POST /query  — RAG pipeline
│   │   └── rag/
│   │       ├── chunks.py    # Text extraction + token-window chunking
│   │       └── embeddings.py# Gemini embedding + cosine search
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router, auth context, theme context
│   │   ├── pages/
│   │   │   ├── Welcome.jsx  # Landing page + live query sandbox
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── AdminPage.jsx# Document management + RAG chat + analytics
│   │   │   └── UserChatPage.jsx # User-facing AI chat
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   └── services/
│   │       └── api.js       # All Axios API calls
│   ├── dockerfile
│   └── .env.example
├── docker-compose.yml
└── DOCUMENTATION.md
```

---

## Quick Start — Local Development

### Prerequisites
- Python 3.12+, `pip`
- Node.js 22+, `npm`
- A PostgreSQL database URL (or leave empty to use SQLite fallback)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 1 — Backend

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL and GEMINI_API
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API runs at **http://localhost:8000** · Interactive docs at **http://localhost:8000/docs**

### 2 — Frontend

```bash
cd frontend
cp .env.example .env          # set VITE_BACKEND_URL if needed
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## Quick Start — Docker

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL and GEMINI_API

docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

> For production, update `VITE_BACKEND_URL` in `docker-compose.yml` to your public backend address before building.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Recommended | PostgreSQL connection string. Omit to fall back to local SQLite. |
| `GEMINI_API` | **Yes** | Google Gemini API key for embeddings and LLM generation. |
| `UPLOAD_DIR` | No | Upload directory path. Defaults to `uploads`. |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:8000` | Backend base URL baked into the JS bundle at build time. |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | Public | Register a new user |
| `POST` | `/login` | Public | Authenticate and get user info |
| `POST` | `/admin/upload` | Admin | Upload a document (triggers RAG pipeline) |
| `GET` | `/admin/documents` | Admin | List all documents |
| `GET` | `/admin/documents/{id}` | Admin | Get document metadata |
| `GET` | `/admin/documents/{id}/download` | Admin | Download raw file |
| `PATCH` | `/admin/documents/{id}` | Admin | Update filename / description / tags |
| `DELETE` | `/admin/documents/{id}` | Admin | Delete document + chunks |
| `GET` | `/user/documents` | User/Admin | Read-only document list |
| `POST` | `/query` | User/Admin | Semantic search + Gemini answer |

Auth is header-based: `X-User-Role: admin` or `X-User-Role: user`.

---

## Roles

| Role | Capabilities |
|---|---|
| `admin` | Full document management (upload / edit / delete) + RAG chat + analytics |
| `user` | Read-only document list + RAG chat assistant |

---

## Documentation

See **[DOCUMENTATION.md](DOCUMENTATION.md)** for the full technical reference including architecture diagrams, data models, the RAG pipeline breakdown, and deployment notes.
