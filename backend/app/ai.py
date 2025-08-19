"""
AI orchestrator for the QMS module.

- Works fully offline using DB analytics (no external calls required).
- If GEMINI_API_KEY is present, it will also call Google Gemini (default model: gemini-2.5-pro)
  and attach a polished summary in `gemini_text`.

Provided actions (use in POST /ai/analyze):
  - "high_risk"
  - "summarize_open_last_month"  (optional: timeframe_days)
  - "suggest_next_steps"         (requires: event_id)
  - "capa_trends"
  - "closure_draft"              (requires: event_id)
"""
from __future__ import annotations

import os
import json
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import httpx

from . import crud

# Load .env at import time
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")  # you asked for 2.5 Pro

# ---- Internal: Gemini HTTP caller (with endpoint fallback) -------------------

def _call_gemini(prompt: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Returns (text, model_used) if successful, otherwise (None, None).
    Tries stable 'v1' endpoint first, then 'v1beta' as a fallback.
    """
    if not GEMINI_API_KEY:
        return None, None

    endpoints = [
        f"https://generativelanguage.googleapis.com/v1/models/{GEMINI_MODEL}:generateContent",
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent",
    ]
    body = {"contents": [{"parts": [{"text": prompt}]}]}

    for url in endpoints:
        try:
            with httpx.Client(timeout=40) as client:
                r = client.post(f"{url}?key={GEMINI_API_KEY}", json=body)
                if r.status_code == 404:
                    # Try next endpoint/model if this one isn't enabled
                    continue
                r.raise_for_status()
                data = r.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text, GEMINI_MODEL
        except Exception:
            # fall through to next endpoint
            continue

    # If we reach here, either the model/endpoint isn't available or key invalid.
    return None, None


def _wrap_with_gemini(title: str, payload: dict) -> dict:
    """
    Adds 'gemini_text' (if available) by prompting Gemini to write a concise,
    regulated QMS-style output based on the structured payload.
    """
    # Keep prompt compact and compliant; payload gives the factual context.
    prompt = (
        "You are a Quality Management System (QMS) assistant for a life-science company. "
        "Write a concise response with bullet points, neutral/regulated tone, and actionable clarity. "
        f"Card Title: {title}\n"
        "Context JSON:\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )

    text, model_used = _call_gemini(prompt)
    out = {"title": title, **payload}
    if text:
        out["gemini_text"] = text
        out["model"] = model_used
    return out

# ---- Public entry: used by POST /ai/analyze ----------------------------------

def respond(db: Session, action: str, event_id: int | None, timeframe_days: int | None = 30) -> dict:
    action = (action or "").lower().strip()

    if action == "high_risk":
        items = crud.high_risk_events(db)
        payload = {
            "items": [
                {
                    "id": e.id,
                    "title": e.title,
                    "severity": e.severity,
                    "status": e.status,
                    "department": e.department,
                    "due_date": e.due_date.isoformat() if e.due_date else None,
                }
                for e in items
            ],
            "count": len(items),
            "criteria": "High/Critical severity or open & overdue"
        }
        return _wrap_with_gemini("High-risk events", payload)

    if action == "summarize_open_last_month":
        items = crud.open_events_last_month(db, timeframe_days or 30)
        by_sev: dict[str, int] = {}
        by_status: dict[str, int] = {}
        for e in items:
            by_sev[e.severity] = by_sev.get(e.severity, 0) + 1
            by_status[e.status] = by_status.get(e.status, 0) + 1
        payload = {
            "timeframe_days": timeframe_days or 30,
            "counts_by_severity": by_sev,
            "counts_by_status": by_status,
            "total_open": len(items),
        }
        return _wrap_with_gemini("Open events (last month)", payload)

    if action == "suggest_next_steps":
        if not event_id:
            return {"error": "Missing 'event_id' for suggest_next_steps"}
        e = crud.get_event(db, event_id)
        if not e:
            return {"error": f"Event {event_id} not found"}

        suggestions = [
            "Confirm root cause using 5-Why or Fishbone.",
            "Assign action owner with target due date.",
            "Update status to In-Progress; define interim controls.",
            "Attach supporting evidence (SOP refs, logs, screenshots).",
            "Plan effectiveness check and acceptance criteria."
        ]
        if e.severity in ("High", "Critical"):
            suggestions.insert(0, "Escalate to QA lead; initiate immediate containment.")

        payload = {
            "event": {
                "id": e.id, "title": e.title, "type": e.event_type,
                "status": e.status, "severity": e.severity, "priority": e.priority,
                "department": e.department
            },
            "suggested_next_steps": suggestions
        }
        return _wrap_with_gemini(f"Next steps for Event #{e.id}", payload)

    if action == "capa_trends":
        data = crud.capa_trends(db)  # [{status, severity, count}]
        payload = {"trend_table": data, "note": "Counts for CAPA events grouped by status x severity"}
        return _wrap_with_gemini("CAPA trends", payload)

    if action == "closure_draft":
        if not event_id:
            return {"error": "Missing 'event_id' for closure_draft"}
        e = crud.get_event(db, event_id)
        if not e:
            return {"error": f"Event {event_id} not found"}

        payload = {
            "event": {
                "id": e.id, "title": e.title, "type": e.event_type,
                "department": e.department, "status": e.status, "severity": e.severity
            },
            "proposed_closure_template": {
                "summary": e.description[:600],
                "actions_taken": ["[list actions]"],
                "verification": "Evidence attached and reviewed.",
                "effectiveness_check": "Scheduled within 30 days of closure.",
                "proposed_status": "Closed"
            }
        }
        return _wrap_with_gemini(f"Closure draft for Event #{e.id}", payload)

    # Unknown action
    return {
        "error": "Unknown action. Use one of: high_risk, summarize_open_last_month, "
                 "suggest_next_steps, capa_trends, closure_draft"
    }
