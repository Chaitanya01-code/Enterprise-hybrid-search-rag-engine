# Enterprise Hybrid Search RAG Engine

An AI-integrated Enterprise Hybrid Search RAG Engine connecting clients and enterprise workers directly to company databases with vector and BM25 search.

## 🚀 How to Run the Application

### 1. Run Backend (FastAPI on Port 8000)

Navigate to the `backend/` folder and launch `uvicorn`:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

> **Note**: The FastAPI app instance is defined in [`backend/app/main.py`](file:///c:/Users/DELL-PC/Documents/Projects/Enterprise-hybrid-search-rag-engine/backend/app/main.py), so the correct module target is **`app.main:app`** (not `backend.app` or `app.app`).

---

### 2. Run Frontend (React Vite on Port 5173)

Navigate to the `frontend/` folder and start the dev server:

```bash
cd frontend
npm run dev
```

The frontend welcome page will load at `http://localhost:5173/` with routes for `/login` and `/signup`.
