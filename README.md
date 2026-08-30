# RE:ACT — AI Deal Rescue Agent

Local-first hackathon prototype for detecting sales deals at risk, recommending next-best actions, drafting follow-ups, and executing actions.

## Stack
- Frontend: Vite + React
- Backend: FastAPI + Python
- Storage: SQLite/JSON (local)
- AI: deterministic intelligence engine first; optional Ollama adapter later

## Run

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.
