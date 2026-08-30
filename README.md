# RE:ACT

## AI Deal Rescue Agent

RE:ACT is an AI-powered sales rescue agent designed to prevent revenue loss from stalled deals. It continuously scans sales opportunities, extracts risk signals, calculates explainable deal-risk scores, recommends the next-best action, and generates context-aware follow-up messages for human approval.

Built as an AI Product Hackathon submission, RE:ACT transforms passive CRM tracking into an active, proactive sales intervention workflow.

---

## 🎯 The Problem

Sales representatives manage dozens of prospects across calls, emails, and meetings. In fast-paced sales environments, critical follow-ups are easily forgotten, commitments are missed, and buyer objections go unanswered. 

As days turn into weeks without contact, promising opportunities quietly go cold—costing organizations millions in preventable lost revenue.

---

## 💡 The Solution

RE:ACT acts as an intelligent co-pilot for sales teams. Instead of waiting for reps to manually check pipeline recency, RE:ACT:

1. **Surfaces at-risk opportunities** before they are lost.
2. **Synthesizes conversation and timeline signals** into transparent risk drivers.
3. **Recommends specific, prioritized next-best actions** with confidence scoring.
4. **Drafts personalized follow-up messages** using exact deal context.
5. **Enforces human-in-the-loop approval** before executing and tracking local interventions.

---

## 🔄 How It Works

```
Conversation & CRM Signals
          │
          ▼
   ┌──────────────┐
   │ Signal Agent │  Identifies inactivity, objections, missed commitments & deadlines
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │  Risk Agent  │  Calculates explainable deal risk score (0–100) & risk drivers
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │Decision Agent│  Evaluates candidate actions & selects Next Best Action
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Action Agent │  Drafts context-aware intervention message
   └──────┬───────┘
          │
          ▼
Human Approval & Execution ──► Local Intervention Recorded & Follow-up Scheduled
```

---

## 🤖 Agent Architecture

RE:ACT uses a specialized multi-agent workflow where each stage has a clear, deterministic responsibility:

1. **Signal Agent**
   - Scans customer interaction evidence and CRM metadata.
   - Detects signals including inactivity gaps, buying intent, price objections, missed seller commitments, and procurement deadlines.

2. **Risk Agent**
   - Synthesizes detected signals into an overall deal-risk score ($0–100$).
   - Categorizes deal urgency (`WATCH`, `HIGH`, `CRITICAL`) and generates human-readable risk drivers.

3. **Decision Agent**
   - Evaluates candidate policies (`FOLLOW_UP`, `ADDRESS_OBJECTION`, `CALL`, `SEND_CASE_STUDY`, `ESCALATE`, `MONITOR`).
   - Selects the optimal Next Best Action with confidence scoring and explicit reasoning.

4. **Action Agent**
   - Synthesizes conversation context into a personalized follow-up message draft.
   - Prepares the intervention for human review and records local execution audit logs.

---

## 🛡️ Human-in-the-Loop Principle

RE:ACT is explicitly designed with a **Human-in-the-Loop** safety architecture:

`AI RECOMMENDS` $\rightarrow$ `HUMAN APPROVES` $\rightarrow$ `ACTION EXECUTED` $\rightarrow$ `FOLLOW-UP TRACKED`

The AI agent never sends communication autonomously. The salesperson retains full control to edit, regenerate, or approve every message before execution.

---

## ✨ Key Features

- **Pipeline Scanning:** Evaluates multi-deal CRM snapshots for follow-up gaps.
- **Priority Queue:** Surfaces high-risk deals requiring immediate rep intervention.
- **Explainable Risk Scoring:** Provides clear, evidence-based risk drivers ($0–100$).
- **Next-Best-Action Recommendations:** Policy selection with confidence percentages.
- **Personalized Message Drafts:** Context-aware email generation incorporating deal specifics.
- **Interactive Agent Reasoning Inspector:** 4-stage breakdown of agent decision-making.
- **Visual Decision Path:** Flow diagram showing evidence formula synthesis.
- **Live Signal Simulator:** Interactive scenario testing (e.g., inbound 15% competitor undercut).
- **Audit Logging & Follow-up Scheduling:** Tracks completed interventions and next contact dates.
- **Demo Reset Utility:** One-click restoration of baseline demo state.

---

## 📊 Demo Scenario

The demo environment pre-loads a representative sales pipeline containing:
- **127** active opportunities
- **18** overdue follow-ups
- **3** critical at-risk deals

### Featured Deal: Acme Corporation
- **Deal Value:** ₹8,50,000
- **Risk Score:** 87 / 100 (`CRITICAL`)
- **Detected Signals:** 6 days inactive, pricing objection raised, missed seller commitment, procurement deadline approaching next Tuesday.
- **Recommended Action:** `FOLLOW_UP` — Send revised commercial proposal pack today.
- **Simulated Adaptation:** Injecting a 15% competitor undercut signal dynamically shifts risk to **91** and policy to `ADDRESS_OBJECTION` (91% confidence).

---

## 🛠️ Tech Stack

### Frontend
- **React** (UI component architecture)
- **Vite** (Build tool & development server)
- **JavaScript (ES6+)**
- **Vanilla CSS** (Custom B2B SaaS design system with Lucide Icons)

### Backend
- **Python 3.11+**
- **FastAPI** (High-performance REST API endpoints)
- **Pydantic** (Data validation & request schemas)

### Version Control & Tooling
- **Git** & **GitHub**

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
The FastAPI backend runs at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Vite development server runs at `http://localhost:5173`.

### Environment Configuration
- Frontend: Copy `frontend/.env.example` to `frontend/.env` to configure `VITE_API_URL`.
- Backend: Copy `backend/.env.example` to `backend/.env` to configure `FRONTEND_URL`.

---

## 📁 Project Structure

```
react-ai-deal-rescue/
├── backend/
│   ├── app.py              # FastAPI REST endpoints & multi-agent logic
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── src/
│   │   ├── main.jsx        # React application entry & UI views
│   │   ├── styles.css      # B2B SaaS design system styles
│   │   └── index.html      # HTML root template
│   ├── package.json        # Frontend dependencies & scripts
│   ├── package-lock.json   # Package lockfile
│   └── .env.example        # Environment variable template
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

---

## 🏆 Hackathon Context

RE:ACT was developed as a submission for the **Product Space AI Product Hackathon**. It focuses on solving the universal B2B sales problem of dropped follow-ups using a practical, human-in-the-loop multi-agent architecture.

---

## ⚠️ Scope & Prototype Limitations

To maintain focus and reliability during hackathon evaluation:
- The prototype uses a **representative local sales dataset** for deterministic demonstration.
- External production integrations (e.g., live Gmail API, live CRM APIs) are not connected in this prototype.
- Customer-facing communications are demonstrated within the local application workflow rather than actual external email dispatch.

---

## 🔮 Future Scope

Planned enhancements for future production iterations:
- **Live CRM Integration:** Bi-directional sync with HubSpot, Salesforce, and Pipedrive.
- **Email & Calendar Sync:** Real-time ingestion via Gmail and Microsoft Outlook APIs.
- **Call Transcript Analysis:** Automated signal extraction from Gong, Chorus, or Zoom transcripts.
- **Autonomous Multi-Channel Interventions:** Slack/Teams notifications for reps when deals enter critical risk states.

---

## 🌟 Why RE:ACT?

> *"RE:ACT doesn't just tell sales teams which deals are at risk. It explains why, decides what should happen next, and turns that decision into an actionable intervention."*
