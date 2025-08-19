# QMS Event Module — AI Assisted (FastAPI + React)

A compact Quality Management System (QMS) module:
- **Frontend**: React (Vite) + Redux Toolkit
- **Backend**: FastAPI + SQLite
- **AI (optional)**: Gemini **2.5 Pro** for polished guidance

The app matches the Round-3 brief: a **3-step wizard** to create events, an **events list** with filters, and an **AI panel** with 5 one-click tools.

---

## ✨ Features

- **Create QMS Events** via a **3-step wizard**
  - *Basics* → *Details* → *Risk & Schedule*
- **Events List** (server-ordered newest first)
  - Columns: *Event ID · Title · Type · Status · Due Date · Initiator · Severity*
  - Filters: *Status · Severity · Type*
- **AI Assistance** (button-based; `POST /ai/analyze`)
  1. **Show high-risk events** (High/Critical or overdue)
  2. **Summarize open events (30d)** (counts by severity & status)
  3. **Suggest next steps (selected)** (requires event selection)
  4. **Identify CAPA trends** (Status × Severity for CAPA type)
  5. **Generate closure draft (selected)** (requires event selection)
- Works **offline** (deterministic analytics). If Gemini is configured, responses also include a concise **`gemini_text`**.

---

## 🧱 Tech Stack

- **Frontend**: React (Vite), Redux Toolkit, React Router, Day.js
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic
- **AI**: Optional Google Gemini 2.5 Pro (via HTTP API)
- **Dev**: CORS enabled for local dev

---

## 🚀 Quickstart

### Prereqs
- Python **3.10+**
- Node **18+**
- macOS/Linux/WSL recommended

### 1) Backend (port **8001**)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# (Optional) AI:
# cp .env.example .env
# then edit backend/.env:
# GEMINI_API_KEY=YOUR_KEY
# GEMINI_MODEL=gemini-2.5-pro

uvicorn app.main:app --reload --port 8001
Swagger: http://127.0.0.1:8001/docs

2) Frontend (Vite)
cd frontend
npm install

# point frontend to backend
# cp .env.example .env   # (ensure URL matches your backend)
# by default:
# VITE_API_BASE_URL=http://127.0.0.1:8001

npm run dev -- --host 127.0.0.1 --port 5173
