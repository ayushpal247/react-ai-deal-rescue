import copy
from datetime import datetime, timedelta
import os
from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

app = FastAPI(title="RE:ACT API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOW = datetime(2026, 8, 30, 9, 0, 0)

SCAN_STAGES = [
    {"id": "pipeline", "label": "Scanning pipeline", "detail": "Reading 127 opportunities from the local CRM snapshot"},
    {"id": "analyze", "label": "Analyzing opportunities", "detail": "Scoring stage, deal value, and recency"},
    {"id": "gaps", "label": "Detecting follow-up gaps", "detail": "18 conversations past the expected reply window"},
    {"id": "investigate", "label": "Investigating high-risk deals", "detail": "Opening Acme Corporation, NovaTech, and Zenly Systems"},
    {"id": "signals", "label": "Evaluating risk signals", "detail": "Linking inactivity, objections, missed commitments, and deadlines"},
    {"id": "decide", "label": "Selecting next-best actions", "detail": "Choosing from FOLLOW_UP, CALL, ADDRESS_OBJECTION, SEND_CASE_STUDY, ESCALATE, MONITOR"},
    {"id": "prepare", "label": "Preparing interventions", "detail": "Queuing context-aware follow-ups for the priority list"},
]


def nba(code: str, label: str, why: str, confidence: float, purpose: str) -> dict[str, Any]:
    return {
        "code": code,
        "label": label,
        "why": why,
        "confidence": confidence,
        "purpose": purpose,
    }


LEADS: list[dict[str, Any]] = [
    {
        "id": "acme",
        "company": "Acme Corporation",
        "contact": "Rahul Sharma",
        "email": "rahul.sharma@acme.example",
        "deal_value": 850000,
        "stage": "Proposal",
        "last_contact_days": 6,
        "risk": 87,
        "prior_risk": 72,
        "risk_level": "CRITICAL",
        "status": "At Risk",
        "recovery_weight": 0.82,
        "objection": "current proposal is above the internal budget range",
        "previous_commitment": "send the revised pricing tomorrow",
        "deadline": "procurement meeting next Tuesday",
        "signals": [
            "6 days since last interaction",
            "pricing objection",
            "seller commitment missed",
            "procurement deadline approaching",
        ],
        "action": "FOLLOW_UP",
        "action_label": "Follow up today",
        "next_best_action": nba(
            "FOLLOW_UP",
            "Follow up today",
            "Buying intent is still explicit, but the seller never sent the promised revised pricing. With procurement next Tuesday, silence now is likely to stall the deal.",
            0.86,
            "Re-open the thread with the missing pricing so Acme can review internally before procurement.",
        ),
        "reason": "Buying intent remains strong, but a missed pricing commitment creates a high likelihood of deal stagnation ahead of procurement.",
        "agent_reasoning": [
            "Inactivity: 6 days since last interaction after a priced proposal.",
            "Pricing objection: Rahul flagged that the current number sits above budget.",
            "Missed commitment: the rep promised revised pricing the next day and did not send it.",
            "Deadline: procurement review is next Tuesday; without a number, the deal cannot move.",
        ],
        "conversation": [
            {"speaker": "Rep", "text": "I'll send the revised pricing tomorrow."},
            {"speaker": "Rahul", "text": "Great. We need to review it internally before the procurement meeting next Tuesday."},
        ],
        "evidence": [
            {
                "id": "acme-e1",
                "kind": "meeting",
                "date": "2026-08-18",
                "title": "Proposal walkthrough",
                "excerpt": "Rahul: \"We're aligned on the workflow. If you can get the commercial closer to what finance expects, I can take this into procurement next week.\"",
                "signals": ["buying intent", "pricing objection", "deadline"],
            },
            {
                "id": "acme-e2",
                "kind": "email",
                "date": "2026-08-24",
                "title": "Pricing follow-up (rep commitment)",
                "excerpt": "Amit: \"I'll send the revised pricing tomorrow so you have it before the internal review.\"",
                "signals": ["seller commitment"],
            },
            {
                "id": "acme-e3",
                "kind": "email",
                "date": "2026-08-24",
                "title": "Buyer confirmation",
                "excerpt": "Rahul: \"Great. We need to review it internally before the procurement meeting next Tuesday.\"",
                "signals": ["deadline", "buying intent"],
            },
            {
                "id": "acme-e4",
                "kind": "note",
                "date": "2026-08-30",
                "title": "Gap detected by Signal Agent",
                "excerpt": "No outbound message after the pricing commitment. Last interaction 6 days ago. Revised pricing was never delivered.",
                "signals": ["missed commitment", "inactivity"],
            },
        ],
        "signal_count": 14,
        "interaction_count": 3,
        "next_follow_up_days": None,
        "intervention_completed": False,
        "generated_message": None,
        "action_history": [],
    },
    {
        "id": "novatech",
        "company": "NovaTech",
        "contact": "Priya Menon",
        "email": "priya.menon@novatech.example",
        "deal_value": 620000,
        "stage": "Negotiation",
        "last_contact_days": 5,
        "risk": 81,
        "prior_risk": 68,
        "risk_level": "CRITICAL",
        "status": "At Risk",
        "recovery_weight": 0.78,
        "objection": "another vendor is 12% cheaper",
        "previous_commitment": "come back with an option that fits the budget",
        "deadline": "vendor shortlist freeze this Friday",
        "signals": [
            "5 days since last interaction",
            "Discount request unresolved",
            "Competitor mentioned",
        ],
        "action": "ADDRESS_OBJECTION",
        "action_label": "Address pricing objection",
        "next_best_action": nba(
            "ADDRESS_OBJECTION",
            "Address pricing objection",
            "Priya is actively comparing vendors and the promised budget option was never sent. A competitor gap of 12% will close this deal if left unanswered.",
            0.81,
            "Answer the price gap with a scoped option before the vendor shortlist freeze.",
        ),
        "reason": "The buyer is evaluating alternatives and has an unresolved pricing objection.",
        "agent_reasoning": [
            "Inactivity: 5 days with no commercial response.",
            "Pricing objection: a competing vendor is 12% cheaper.",
            "Missed commitment: the rep offered a budget-fit option and did not return.",
        ],
        "conversation": [
            {"speaker": "Priya", "text": "The product looks good, but another vendor is 12% cheaper."},
            {"speaker": "Rep", "text": "I'll come back with an option that fits your budget."},
        ],
        "evidence": [
            {
                "id": "nova-e1",
                "kind": "meeting",
                "date": "2026-08-25",
                "title": "Negotiation call",
                "excerpt": "Priya: \"The product looks good, but another vendor is 12% cheaper. If you can meet us closer, we can keep you on the shortlist.\"",
                "signals": ["buying intent", "pricing objection"],
            },
            {
                "id": "nova-e2",
                "kind": "email",
                "date": "2026-08-25",
                "title": "Rep commitment",
                "excerpt": "Amit: \"I'll come back with an option that fits your budget.\"",
                "signals": ["seller commitment"],
            },
            {
                "id": "nova-e3",
                "kind": "note",
                "date": "2026-08-30",
                "title": "Silence after commitment",
                "excerpt": "No commercial pack sent. Shortlist freeze is this Friday.",
                "signals": ["missed commitment", "inactivity", "deadline"],
            },
        ],
        "signal_count": 9,
        "interaction_count": 2,
        "next_follow_up_days": None,
        "intervention_completed": False,
        "generated_message": None,
        "action_history": [],
    },
    {
        "id": "zenly",
        "company": "Zenly Systems",
        "contact": "Arjun Rao",
        "email": "arjun.rao@zenly.example",
        "deal_value": 410000,
        "stage": "Discovery",
        "last_contact_days": 4,
        "risk": 73,
        "prior_risk": 61,
        "risk_level": "HIGH",
        "status": "At Risk",
        "recovery_weight": 0.71,
        "objection": None,
        "previous_commitment": "bring finance into the discussion",
        "deadline": "internal reporting review in two weeks",
        "signals": ["4 days since last interaction", "High buying intent", "Decision maker not yet engaged"],
        "action": "CALL",
        "action_label": "Schedule stakeholder call",
        "next_best_action": nba(
            "CALL",
            "Schedule stakeholder call",
            "Interest is high, but finance has not joined. A discovery-stage deal without the decision maker typically stalls after the champion goes quiet.",
            0.74,
            "Get finance on a 20-minute call while reporting pain is still acute.",
        ),
        "reason": "Strong interest is visible, but the decision maker has not joined the process.",
        "agent_reasoning": [
            "Buying intent: Arjun said this could solve the reporting problem.",
            "Gap: finance / decision maker is not in the thread.",
            "Inactivity: 4 days since the last exchange.",
        ],
        "conversation": [
            {"speaker": "Arjun", "text": "This could solve our reporting problem. I need to bring finance into the discussion."},
        ],
        "evidence": [
            {
                "id": "zenly-e1",
                "kind": "email",
                "date": "2026-08-26",
                "title": "Discovery reply",
                "excerpt": "Arjun: \"This could solve our reporting problem. I need to bring finance into the discussion.\"",
                "signals": ["buying intent"],
            },
            {
                "id": "zenly-e2",
                "kind": "note",
                "date": "2026-08-30",
                "title": "Stakeholder gap",
                "excerpt": "No meeting with finance has been booked. Last contact 4 days ago.",
                "signals": ["inactivity"],
            },
        ],
        "signal_count": 6,
        "interaction_count": 1,
        "next_follow_up_days": None,
        "intervention_completed": False,
        "generated_message": None,
        "action_history": [],
    },
    {
        "id": "orbit",
        "company": "Orbit Retail",
        "contact": "Neha Kapoor",
        "email": "neha.kapoor@orbit.example",
        "deal_value": 290000,
        "stage": "Proposal",
        "last_contact_days": 3,
        "risk": 61,
        "prior_risk": 54,
        "risk_level": "WATCH",
        "status": "Watch",
        "recovery_weight": 0.55,
        "objection": "unclear whether this works for multi-store retailers",
        "previous_commitment": None,
        "deadline": None,
        "signals": ["3 days since last interaction", "Use-case uncertainty"],
        "action": "SEND_CASE_STUDY",
        "action_label": "Send retail case study",
        "next_best_action": nba(
            "SEND_CASE_STUDY",
            "Send retail case study",
            "Neha asked for multi-store proof. Without a relevant example, the proposal stays theoretical.",
            0.68,
            "Send a retail rollout story so the use case is concrete.",
        ),
        "reason": "The buyer needs proof that the solution works in a similar retail environment.",
        "agent_reasoning": [
            "Use-case uncertainty: buyer asked for multi-store retailer examples.",
            "No proof asset has been sent.",
        ],
        "conversation": [
            {"speaker": "Neha", "text": "Do you have examples from retailers with multiple stores?"},
        ],
        "evidence": [
            {
                "id": "orbit-e1",
                "kind": "email",
                "date": "2026-08-27",
                "title": "Proof request",
                "excerpt": "Neha: \"Do you have examples from retailers with multiple stores?\"",
                "signals": ["buying intent"],
            },
        ],
        "signal_count": 4,
        "interaction_count": 1,
        "next_follow_up_days": None,
        "intervention_completed": False,
        "generated_message": None,
        "action_history": [],
    },
    {
        "id": "delta",
        "company": "Delta Labs",
        "contact": "Sameer Shah",
        "email": "sameer.shah@deltalabs.example",
        "deal_value": 180000,
        "stage": "Qualified",
        "last_contact_days": 2,
        "risk": 48,
        "prior_risk": 44,
        "risk_level": "WATCH",
        "status": "Watch",
        "recovery_weight": 0.0,
        "objection": None,
        "previous_commitment": None,
        "deadline": "internal timeline still TBD",
        "signals": ["2 days since last interaction", "Positive sentiment"],
        "action": "MONITOR",
        "action_label": "Monitor",
        "next_best_action": nba(
            "MONITOR",
            "Monitor",
            "Sentiment is positive and no warning signals are firing. Intervening now would be noise.",
            0.62,
            "Hold until the internal timeline is named, then re-score.",
        ),
        "reason": "No urgent warning signals yet. Continue monitoring until the next agreed milestone.",
        "agent_reasoning": [
            "Positive sentiment; last contact 2 days ago.",
            "No objection, missed commitment, or hard deadline.",
        ],
        "conversation": [
            {"speaker": "Sameer", "text": "Looks promising. We should know our internal timeline soon."},
        ],
        "evidence": [
            {
                "id": "delta-e1",
                "kind": "email",
                "date": "2026-08-28",
                "title": "Qualification note",
                "excerpt": "Sameer: \"Looks promising. We should know our internal timeline soon.\"",
                "signals": ["buying intent"],
            },
        ],
        "signal_count": 3,
        "interaction_count": 1,
        "next_follow_up_days": None,
        "intervention_completed": False,
        "generated_message": None,
        "action_history": [],
    },
]

for _lead in LEADS:
    _lead["scan_risk"] = _lead["risk"]

INITIAL_LEADS: list[dict[str, Any]] = copy.deepcopy(LEADS)

ACTIONS: list[dict[str, Any]] = []

SUCCESS_LABEL = {
    "FOLLOW_UP": "FOLLOW-UP SENT",
    "CALL": "CALL SCHEDULED",
    "ADDRESS_OBJECTION": "OBJECTION RESPONSE SENT",
    "SEND_CASE_STUDY": "CASE STUDY SENT",
    "ESCALATE": "ESCALATION LOGGED",
    "MONITOR": "MONITORING",
}

FOLLOW_UP_DAYS = {
    "FOLLOW_UP": 3,
    "CALL": 2,
    "ADDRESS_OBJECTION": 3,
    "SEND_CASE_STUDY": 5,
    "ESCALATE": 1,
    "MONITOR": 7,
}


class ActionRequest(BaseModel):
    lead_id: str
    action_type: str
    content: str | None = None
    subject: str | None = None


class SimulateRequest(BaseModel):
    lead_id: str
    scenario_id: str


def lead_or_404(lead_id: str):
    for lead in LEADS:
        if lead["id"] == lead_id:
            return lead
    return None


def drafts_for(lead: dict[str, Any]) -> list[dict[str, str]]:
    first = lead["contact"].split()[0]
    company = lead["company"]
    objection = lead.get("objection")
    commitment = lead.get("previous_commitment")
    deadline = lead.get("deadline")
    last = lead["conversation"][-1]["text"] if lead.get("conversation") else ""

    if lead["action"] == "FOLLOW_UP":
        return [
            {
                "subject": f"{company} — revised pricing before procurement",
                "body": (
                    f"Hi {first},\n\n"
                    f"Following up on the revised pricing I said I would send after our last conversation. "
                    f"You noted the current proposal is above the internal budget range, and that your team needs the updated number "
                    f"before the {deadline}.\n\n"
                    f"I still owe you that pack — the commitment was to {commitment}, and I have not closed that loop. "
                    f"I'm sending the revised commercial now so you can review internally ahead of procurement.\n\n"
                    f"Would a 15-minute call today or tomorrow help you walk it into the meeting?\n\n"
                    f"Best,\nAmit"
                ),
            },
            {
                "subject": f"Before Tuesday's procurement review — {company}",
                "body": (
                    f"Hi {first},\n\n"
                    f"You wrote: \"{last}\"\n\n"
                    f"I committed to {commitment} and that did not go out. With the {deadline} approaching, "
                    f"I do not want the pricing objection to be the reason this stalls.\n\n"
                    f"The revised option is ready and addresses the budget concern you raised. "
                    f"If useful, I can join a short working session with whoever is reviewing it internally.\n\n"
                    f"Best,\nAmit"
                ),
            },
            {
                "subject": f"{first} — catching up on the pricing commitment",
                "body": (
                    f"Hi {first},\n\n"
                    f"Quick correction on my side: I promised to {commitment} and you have not received it. "
                    f"That is on me. Given the {deadline}, I'm putting the revised pricing in your inbox today "
                    f"so finance is not blocked.\n\n"
                    f"Happy to answer questions the same day if anything is still above range.\n\n"
                    f"Best,\nAmit"
                ),
            },
        ]

    if lead["action"] == "ADDRESS_OBJECTION":
        if lead["id"] == "acme":
            return [
                {
                    "subject": f"{company} — competing quote breakdown before procurement",
                    "body": (
                        f"Hi {first},\n\n"
                        f"Thanks for flagging the competing quote. Before procurement, I'd like to show you exactly where the difference comes from "
                        f"and outline a configuration that keeps the workflow you preferred while addressing the commercial gap.\n\n"
                        f"Could we review the two options for 15 minutes today?\n\n"
                        f"Best,\nAmit"
                    ),
                },
                {
                    "subject": f"Before procurement — 15% price gap option for {company}",
                    "body": (
                        f"Hi {first},\n\n"
                        f"Returning to your note about the 15% lower offer. I've prepared a phased option that matches your budget constraints "
                        f"without sacrificing core capabilities.\n\n"
                        f"Happy to jump on a quick 10-minute call today to review.\n\n"
                        f"Best,\nAmit"
                    ),
                },
            ]
        return [
            {
                "subject": f"{company} — option against the 12% gap",
                "body": (
                    f"Hi {first},\n\n"
                    f"You flagged that {objection}. I said I would {commitment}, and I have not yet sent that option.\n\n"
                    f"I've scoped a configuration that keeps the workflow you liked and closes most of the gap, "
                    f"before the {deadline}.\n\n"
                    f"Can we walk through the trade-offs this week so you can keep us on the shortlist?\n\n"
                    f"Best,\nAmit"
                ),
            },
        ]

    if lead["action"] == "CALL":
        return [
            {
                "subject": f"{company} — 20 minutes with finance",
                "body": (
                    f"Hi {first},\n\n"
                    f"You mentioned you need to {commitment}. You also said this could solve the reporting problem — "
                    f"I want finance in the room while that pain is still current, ahead of the {deadline}.\n\n"
                    f"Would a 20-minute call this week work for you and your finance stakeholder?\n\n"
                    f"Best,\nAmit"
                ),
            },
            {
                "subject": f"Reporting / ROI session for {company}",
                "body": (
                    f"Hi {first},\n\n"
                    f"Picking up on: \"{last}\"\n\n"
                    f"I can run a short session aimed at the questions finance usually asks on reporting and ROI. "
                    f"What time works for you and that stakeholder?\n\n"
                    f"Best,\nAmit"
                ),
            },
        ]

    if lead["action"] == "SEND_CASE_STUDY":
        return [
            {
                "subject": f"Multi-store retail example for {company}",
                "body": (
                    f"Hi {first},\n\n"
                    f"You asked: \"{last}\"\n\n"
                    f"I'm sending a rollout story from a retailer operating multiple stores — coverage, reporting, and how they phased stores. "
                    f"That should speak directly to the concern that {objection}.\n\n"
                    f"Happy to walk through it if useful.\n\n"
                    f"Best,\nAmit"
                ),
            },
            {
                "subject": f"{company} — customer story attached",
                "body": (
                    f"Hi {first},\n\n"
                    f"Attaching the multi-store example you requested so the proposal is easier to evaluate internally.\n\n"
                    f"Best,\nAmit"
                ),
            },
        ]

    return [
        {
            "subject": f"{company} — checking the internal timeline",
            "body": (
                f"Hi {first},\n\n"
                f"Thanks for the update. I'll hold until the {deadline} is clearer and check back then.\n\n"
                f"Best,\nAmit"
            ),
        }
    ]


def agent_activity(lead: dict[str, Any], message_ready: bool) -> list[dict[str, str]]:
    if lead.get("intervention_completed"):
        label = SUCCESS_LABEL.get(lead["action"], "FOLLOW-UP EXECUTED")
        days = lead.get("next_follow_up_days", 3)
        action_detail = f"{label} · Next follow-up in {days} days"
    elif message_ready or lead.get("generated_message"):
        action_detail = "Generated personalized message"
    else:
        action_detail = "Standing by to generate a personalized message"

    return [
        {
            "agent": "Signal Agent",
            "detail": f"Extracted {lead['signal_count']} signals from {lead['interaction_count']} interactions",
        },
        {
            "agent": "Risk Agent",
            "detail": f"Risk score: {lead['prior_risk']} -> {lead['scan_risk']}",
        },
        {
            "agent": "Decision Agent",
            "detail": f"Selected {lead['action']}",
        },
        {
            "agent": "Action Agent",
            "detail": action_detail,
        },
    ]


def public_lead(lead: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": lead["id"],
        "company": lead["company"],
        "contact": lead["contact"],
        "deal_value": lead["deal_value"],
        "stage": lead["stage"],
        "last_contact_days": lead["last_contact_days"],
        "risk": lead["risk"],
        "risk_level": lead["risk_level"],
        "status": lead["status"],
        "signals": lead["signals"],
        "action": lead["action"],
        "action_label": lead["action_label"],
        "reason": lead["reason"],
        "intervention_completed": lead["intervention_completed"],
        "next_follow_up_days": lead["next_follow_up_days"],
    }


def estimated_recovery() -> int:
    total = 0
    for lead in LEADS:
        if lead["risk"] >= 70 and lead["action"] != "MONITOR" and not lead["intervention_completed"]:
            total += int(lead["deal_value"] * lead["recovery_weight"])
    return total


@app.get("/api/health")
def health():
    return {"status": "ok", "agent_mode": "LOCAL_INTELLIGENCE"}


@app.get("/api/dashboard")
def dashboard():
    at_risk = [x for x in LEADS if x["risk"] >= 70 and not x["intervention_completed"]]
    risk_value = sum(x["deal_value"] for x in at_risk)
    return {
        "total_opportunities": 127,
        "overdue_followups": 18,
        "at_risk_deals": len(at_risk),
        "revenue_at_risk": risk_value,
        "estimated_recovery_opportunity": estimated_recovery(),
        "pipeline_value": sum(x["deal_value"] for x in LEADS),
        "leads": [public_lead(x) for x in LEADS],
        "recent_actions": ACTIONS[-8:][::-1],
        "scan_stages": SCAN_STAGES,
    }


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str):
    lead = lead_or_404(lead_id)
    if not lead:
        return {"error": "Lead not found"}
    variants = drafts_for(lead)
    draft = variants[0]

    # Structure 4-stage inspector metadata per lead
    if lead["id"] == "acme":
        detected_signals = ["buying intent", "pricing objection", "seller commitment", "missed commitment", "deadline", "inactivity"]
        risk_drivers = ["6 days since last interaction", "pricing objection", "missed seller commitment", "procurement deadline approaching"]
        candidate_actions = ["FOLLOW_UP", "CALL", "ADDRESS_OBJECTION", "MONITOR"]
        uses = ["buyer name", "pricing objection", "missed commitment", "procurement deadline", "previous conversation"]
        path_nodes = ["Pricing objection", "Missed commitment", "6 days inactivity", "Procurement deadline"]
        urgency = "HIGH URGENCY = FOLLOW UP TODAY"
    elif lead["id"] == "novatech":
        detected_signals = ["buying intent", "pricing objection", "competitor mentioned", "seller commitment", "missed commitment", "deadline", "inactivity"]
        risk_drivers = ["5 days since last interaction", "Discount request unresolved", "Competitor mentioned (12% gap)"]
        candidate_actions = ["ADDRESS_OBJECTION", "FOLLOW_UP", "ESCALATE", "MONITOR"]
        uses = ["buyer name", "pricing objection", "competing vendor (12% gap)", "shortlist freeze deadline", "budget-fit option"]
        path_nodes = ["Competitor 12% cheaper", "Discount request unresolved", "5 days inactivity", "Shortlist freeze Friday"]
        urgency = "HIGH URGENCY = ADDRESS OBJECTION"
    elif lead["id"] == "zenly":
        detected_signals = ["buying intent", "stakeholder gap", "decision maker absent", "inactivity"]
        risk_drivers = ["4 days since last interaction", "High buying intent", "Decision maker (finance) not engaged"]
        candidate_actions = ["CALL", "FOLLOW_UP", "SEND_CASE_STUDY", "MONITOR"]
        uses = ["buyer name", "reporting pain point", "finance stakeholder request", "20-minute ROI call"]
        path_nodes = ["High buying intent", "Finance stakeholder missing", "4 days inactivity"]
        urgency = "MODERATE URGENCY = SCHEDULE STAKEHOLDER CALL"
    elif lead["id"] == "orbit":
        detected_signals = ["buying intent", "use-case uncertainty", "multi-store query"]
        risk_drivers = ["3 days since last interaction", "Use-case uncertainty", "Multi-store proof requested"]
        candidate_actions = ["SEND_CASE_STUDY", "FOLLOW_UP", "CALL", "MONITOR"]
        uses = ["buyer name", "retail case study asset", "multi-store rollout example"]
        path_nodes = ["Multi-store proof request", "3 days inactivity", "Proposal pending review"]
        urgency = "WATCH = SEND RETAIL CASE STUDY"
    else:
        detected_signals = ["positive sentiment", "timeline TBD", "low inactivity"]
        risk_drivers = ["2 days since last interaction", "Positive sentiment", "Timeline TBD"]
        candidate_actions = ["MONITOR", "FOLLOW_UP", "CALL"]
        uses = ["buyer name", "internal timeline check-in"]
        path_nodes = ["Positive sentiment", "Timeline TBD", "2 days inactivity"]
        urgency = "STABLE = MONITOR"

    return {
        "lead": {
            **public_lead(lead),
            "email": lead["email"],
            "objection": lead["objection"],
            "previous_commitment": lead["previous_commitment"],
            "deadline": lead["deadline"],
            "conversation": lead["conversation"],
            "prior_risk": lead["prior_risk"],
            "generated_message": lead["generated_message"],
        },
        "evidence": lead["evidence"],
        "agent_activity": agent_activity(lead, bool(lead.get("generated_message"))),
        "agent_reasoning": lead["agent_reasoning"],
        "next_best_action": lead["next_best_action"],
        "drafts": variants,
        "draft": draft["body"],
        "subject": draft["subject"],
        "action_history": lead["action_history"],
        "agent_analysis": {
            "buying_intent": 0.91 if lead["id"] == "acme" else (0.84 if lead["risk"] >= 80 else 0.76),
            "sentiment": "cautiously_positive" if lead["risk"] >= 80 else "positive",
            "follow_up_required": lead["action"] != "MONITOR",
            "risk_explanation": lead["reason"],
        },
        "inspector": {
            "signal_agent": {
                "input_interactions": lead["interaction_count"],
                "total_signals": lead["signal_count"],
                "detected_signals": detected_signals,
            },
            "risk_agent": {
                "prior_risk": lead["prior_risk"],
                "current_risk": lead["risk"],
                "drivers": risk_drivers,
            },
            "decision_agent": {
                "candidate_actions": candidate_actions,
                "selected": lead["action"],
                "confidence": lead["next_best_action"]["confidence"],
                "why": lead["next_best_action"]["why"],
            },
            "action_agent": {
                "prepared": "Personalized follow-up",
                "uses": uses,
                "status": "EXECUTED" if lead["intervention_completed"] else "READY FOR APPROVAL",
            },
        },
        "decision_path": {
            "nodes": path_nodes,
            "synthesis": urgency,
        },
    }


@app.post("/api/actions")
def execute_action(request: ActionRequest):
    lead = lead_or_404(request.lead_id)
    if not lead:
        return {"error": "Lead not found"}

    # Idempotency check: If intervention is already completed, do NOT create new action or modify lead risk/history
    if lead.get("intervention_completed"):
        existing_action = next((a for a in ACTIONS if a["lead_id"] == lead["id"]), None)
        if not existing_action:
            existing_action = {
                "id": 1,
                "lead_id": lead["id"],
                "company": lead["company"],
                "type": request.action_type,
                "status": "EXECUTED",
                "timestamp": NOW.isoformat(),
                "subject": lead.get("generated_message", {}).get("subject", ""),
                "content": lead.get("generated_message", {}).get("body", ""),
                "success_label": SUCCESS_LABEL.get(request.action_type, "ACTION EXECUTED"),
                "next_follow_up_days": lead.get("next_follow_up_days", 3),
                "next_follow_up_on": (NOW + timedelta(days=lead.get("next_follow_up_days", 3))).strftime("%Y-%m-%d"),
            }
        return {
            "success": True,
            "already_completed": True,
            "action": existing_action,
            "updated_lead": public_lead(lead),
            "action_history": lead["action_history"],
            "estimated_recovery_opportunity": estimated_recovery(),
            "revenue_at_risk": sum(x["deal_value"] for x in LEADS if x["risk"] >= 70 and not x["intervention_completed"]),
            "at_risk_deals": len([x for x in LEADS if x["risk"] >= 70 and not x["intervention_completed"]]),
        }

    variants = drafts_for(lead)
    content = request.content or variants[0]["body"]
    subject = request.subject or variants[0]["subject"]
    follow_days = FOLLOW_UP_DAYS.get(request.action_type, 3)
    timestamp = NOW.isoformat()
    action = {
        "id": len(ACTIONS) + 1,
        "lead_id": lead["id"],
        "company": lead["company"],
        "type": request.action_type,
        "status": "EXECUTED",
        "timestamp": timestamp,
        "subject": subject,
        "content": content,
        "success_label": SUCCESS_LABEL.get(request.action_type, "ACTION EXECUTED"),
        "next_follow_up_days": follow_days,
        "next_follow_up_on": (NOW + timedelta(days=follow_days)).strftime("%Y-%m-%d"),
    }
    ACTIONS.append(action)
    history_item = {
        "id": action["id"],
        "type": request.action_type,
        "label": SUCCESS_LABEL.get(request.action_type, "ACTION EXECUTED"),
        "timestamp": timestamp,
        "note": f"Local action recorded. Next follow-up in {follow_days} days.",
    }
    lead["action_history"] = [history_item, *lead["action_history"]]
    lead["generated_message"] = {"subject": subject, "body": content}
    lead["intervention_completed"] = True
    lead["last_contact_days"] = 0
    lead["next_follow_up_days"] = follow_days
    lead["status"] = "Monitoring"
    if request.action_type != "MONITOR":
        lead["risk"] = max(25, lead["risk"] - 18)
        lead["risk_level"] = "WATCH" if lead["risk"] < 70 else "HIGH"
    return {
        "success": True,
        "action": action,
        "updated_lead": public_lead(lead),
        "action_history": lead["action_history"],
        "estimated_recovery_opportunity": estimated_recovery(),
        "revenue_at_risk": sum(x["deal_value"] for x in LEADS if x["risk"] >= 70 and not x["intervention_completed"]),
        "at_risk_deals": len([x for x in LEADS if x["risk"] >= 70 and not x["intervention_completed"]]),
    }


@app.post("/api/simulate")
def simulate_signal(request: SimulateRequest):
    lead = lead_or_404(request.lead_id)
    if not lead:
        return {"error": "Lead not found"}

    if request.scenario_id == "competitor_undercut":
        sim_evidence = {
            "id": "acme-sim-1",
            "kind": "NEW SIGNAL",
            "date": "2026-08-30",
            "title": "Inbound competitor quote query",
            "excerpt": 'Rahul: "Hi Amit — we received a competing quote that is about 15% lower. Can you help us understand the difference before procurement?"',
            "signals": ["pricing objection", "competitor pressure"],
        }
        if not any(e["id"] == "acme-sim-1" for e in lead["evidence"]):
            lead["evidence"] = [sim_evidence, *lead["evidence"]]

        prior = lead["risk"]
        lead["prior_risk"] = prior
        lead["risk"] = 91
        lead["risk_level"] = "CRITICAL"
        lead["status"] = "At Risk"
        lead["recovery_weight"] = 0.88
        lead["objection"] = "competing vendor quote is 15% lower"
        lead["previous_commitment"] = "address price gap before procurement"
        lead["action"] = "ADDRESS_OBJECTION"
        lead["action_label"] = "Address pricing objection"
        lead["next_best_action"] = nba(
            "ADDRESS_OBJECTION",
            "Address pricing objection",
            "The deal has moved from a follow-up gap to an active competitive objection that needs an immediate commercial response.",
            0.91,
            "Address the price gap before procurement.",
        )
        lead["reason"] = "Inbound buyer signal indicated a 15% lower competitor quote ahead of the procurement review."
        lead["signals"] = [
            "New competitive pricing pressure",
            "pricing objection",
            "competitor pressure",
            "procurement deadline",
        ]
        lead["agent_reasoning"] = [
            "Inbound signal: Rahul reported a competing quote that is 15% lower.",
            "Objection escalated: Commercial price gap requires immediate response before procurement review.",
            "Action shift: Switched intervention policy from routine follow-up to competitive objection handling.",
        ]
        lead["intervention_completed"] = False
        lead["generated_message"] = None

    elif request.scenario_id == "meeting_moved":
        prior = lead["risk"]
        lead["prior_risk"] = prior
        lead["risk"] = 89
        lead["risk_level"] = "CRITICAL"
        lead["status"] = "At Risk"
        lead["action"] = "FOLLOW_UP"
        lead["action_label"] = "Send proposal package today"
        lead["next_best_action"] = nba(
            "FOLLOW_UP",
            "Send proposal package today",
            "Procurement review moved up to tomorrow; team needs final pricing pack immediately.",
            0.94,
            "Get proposal in front of decision makers before tomorrow's meeting.",
        )
        lead["intervention_completed"] = False
        lead["generated_message"] = None

    elif request.scenario_id == "proof_requested":
        prior = lead["risk"]
        lead["prior_risk"] = prior
        lead["risk"] = 78
        lead["risk_level"] = "HIGH"
        lead["action"] = "SEND_CASE_STUDY"
        lead["action_label"] = "Send enterprise case study"
        lead["next_best_action"] = nba(
            "SEND_CASE_STUDY",
            "Send enterprise case study",
            "Buyer champion requested enterprise implementation reference before procurement.",
            0.88,
            "Provide proof of enterprise scale.",
        )
        lead["intervention_completed"] = False
        lead["generated_message"] = None

    return {
        "success": True,
        "scenario_id": request.scenario_id,
        "updated_lead": public_lead(lead),
    }


@app.post("/api/reset")
def reset_demo():
    global LEADS, ACTIONS
    LEADS = copy.deepcopy(INITIAL_LEADS)
    ACTIONS = []
    for lead in LEADS:
        lead["scan_risk"] = lead["risk"]
    return {
        "success": True,
        "message": "Demo state reset to initial baseline",
        "leads": [public_lead(x) for x in LEADS],
    }


@app.post("/api/scan")
def scan():
    flagged = [x for x in LEADS if x["risk"] >= 70 and not x["intervention_completed"]]
    return {
        "success": True,
        "message": "Pipeline scan completed",
        "processed": 127,
        "flagged": len(flagged),
        "top_priority": LEADS[0]["company"],
        "timestamp": NOW.isoformat(),
        "stages": SCAN_STAGES,
        "mode": "LOCAL_INTELLIGENCE",
    }
