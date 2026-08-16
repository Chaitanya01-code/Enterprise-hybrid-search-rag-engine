# Frontend — Enterprise Hybrid Search RAG Engine

React 19 + Vite 8 single-page application providing the user interface for the Enterprise RAG platform. Admins manage documents and query the AI assistant; regular users interact through a dedicated chat interface.

---

## Stack

| Component | Technology |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| HTTP client | Axios |
| Icons | Lucide React |
| Linter | Oxlint |
| Production server | Nginx 1.27 (Docker) |

---

## Directory Structure

```
frontend/
├── src/
│   ├── main.jsx             # React DOM root mount
│   ├── App.jsx              # BrowserRouter, auth context, theme context, route guards
│   ├── App.css              # Global CSS variables, themes, utility classes
│   ├── index.css            # Tailwind base + custom component styles
│   ├── pages/
│   │   ├── Welcome.jsx      # Public landing page with live query sandbox
│   │   ├── Login.jsx        # Login form
│   │   ├── Signup.jsx       # Registration form
│   │   ├── AdminPage.jsx    # Admin dashboard (documents, chat, analytics)
│   │   └── UserChatPage.jsx # User AI chat interface
│   ├── components/
│   │   └── Navbar.jsx       # Top navigation bar (public pages only)
│   └── services/
│       └── api.js           # Axios wrappers for all backend endpoints
├── public/
├── index.html
├── vite.config.js
├── package.json
├── dockerfile
└── .env.example
```

---

## Setup — Local

### Prerequisites
- Node.js 22+ and npm

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env
# VITE_BACKEND_URL defaults to http://localhost:8000

# 3. Start the development server
npm run dev
```

App runs at **http://localhost:5173**

### Other scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

---

## Setup — Docker

```bash
# From the project root
docker compose up --build frontend
```

The multi-stage Dockerfile:
1. **Build stage** (`node:22-alpine`) — runs `npm ci` + `vite build` with `VITE_BACKEND_URL` injected as a build arg.
2. **Serve stage** (`nginx:1.27-alpine`) — serves `dist/` with SPA fallback (`try_files $uri /index.html`) and gzip compression.

The frontend container listens on port `80`.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:8000` | Base URL of the FastAPI backend. Baked into the JS bundle at build time via `import.meta.env.VITE_BACKEND_URL`. |

> **Important:** In Docker, this value is set as a build argument in `docker-compose.yml`. Change `VITE_BACKEND_URL` there before building for production.

---

## Pages & Routes

| Route | Component | Access | Description |
|---|---|---|---|
| `/` | `Welcome` | Public | Landing page, feature overview, live query sandbox |
| `/login` | `Login` | Public | Username or email + password login |
| `/signup` | `Signup` | Public | New account registration |
| `/admin` | `AdminPage` | Admin only | Document management, RAG chat, document analytics |
| `/user` | `UserChatPage` | User only | AI chat assistant interface |

Route guards redirect unauthenticated users to `/login`, and wrong-role users to their correct page.

---

## Pages Detail

### Welcome (`/`)
- Hero section with CTA links to `/signup` and `/login`.
- **Test Connection** button — pings `GET /` and shows backend status.
- **Live AI Console** — authenticated users (or public demo) can submit a query and see the RAG response with source citations and latency.

### AdminPage (`/admin`)
Three-panel layout (resizable via toolbar buttons):

| Panel | Description |
|---|---|
| Document list | Table of all uploaded documents with expand/collapse, download, edit, delete |
| RAG chat | Full chat interface with Gemini-powered answers and markdown rendering |
| Analysis | Document analytics: size distribution, type breakdown, upload timeline |

Admin toolbar actions: **Upload Document**, **Refresh List**, **Toggle Analysis panel**.

### UserChatPage (`/user`)
- Full-screen chat interface with markdown-rendered AI responses.
- Sends `POST /query` with `X-User-Role: user`.
- Greeting detection — responds to "hi/hello/hey" locally without an API call.
- Theme toggle (dark / light) and logout.

---

## Auth & State

User session is stored in `localStorage` as a JSON object:

```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "admin"
}
```

Theme preference (`dark` / `light`) is also persisted in `localStorage`.

Both are managed through React Contexts (`UserContext`, `ThemeContext`) exported from `App.jsx` and consumed via `useUser()` and `useTheme()` hooks.

---

## API Client (`src/services/api.js`)

All calls go through thin Axios wrappers that return `{ success: true, data }` or `{ success: false, error }`.

| Function | Method | Endpoint |
|---|---|---|
| `loginUser(credentials)` | POST | `/login` |
| `signupUser(userData)` | POST | `/signup` |
| `checkBackendHealth()` | GET | `/` |
| `listDocuments(skip, limit)` | GET | `/admin/documents` |
| `uploadDocument(file, desc, tags)` | POST | `/admin/upload` |
| `editDocument(id, payload)` | PATCH | `/admin/documents/{id}` |
| `deleteDocument(id)` | DELETE | `/admin/documents/{id}` |
| `downloadDocumentUrl(id)` | — | `/admin/documents/{id}/download` |
| `listDocumentsUser(skip, limit)` | GET | `/user/documents` |
| `sendQuery(question, role, docId?)` | POST | `/query` |

The base URL is read from `import.meta.env.VITE_BACKEND_URL` with an `http://localhost:8000` fallback.

---

## Dependencies

```json
{
  "dependencies": {
    "axios": "^1.19.0",
    "lucide-react": "^1.31.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router-dom": "^7.18.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^6.0.4",
    "oxlint": "^1.75.0",
    "vite": "^8.2.0"
  }
}
```
