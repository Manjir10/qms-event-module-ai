from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, get_db
from . import models, schemas, crud, ai

# create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="QMS Event Module API", version="1.0")

# CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Event Endpoints ----
@app.post("/events", response_model=schemas.EventOut)
def create_event(payload: schemas.EventCreate, db: Session = Depends(get_db)):
    return crud.create_event(db, payload)

@app.get("/events", response_model=list[schemas.EventOut])
def list_events(
    status: str | None = Query(None),
    severity: str | None = Query(None),
    event_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return crud.list_events(db, status=status, severity=severity, event_type=event_type)

@app.get("/events/{event_id}", response_model=schemas.EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    obj = crud.get_event(db, event_id)
    if not obj:
        raise HTTPException(404, "Event not found")
    return obj

@app.put("/events/{event_id}", response_model=schemas.EventOut)
def update_event(event_id: int, payload: schemas.EventUpdate, db: Session = Depends(get_db)):
    obj = crud.update_event(db, event_id, payload)
    if not obj:
        raise HTTPException(404, "Event not found")
    return obj

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_event(db, event_id)
    if not ok:
        raise HTTPException(404, "Event not found")
    return {"ok": True}

# ---- AI Assistance ----
@app.post("/ai/analyze")
def ai_analyze(query: schemas.AIQuery, db: Session = Depends(get_db)):
    return ai.respond(db, action=query.action, event_id=query.event_id, timeframe_days=query.timeframe_days)

@app.get("/")
def health():
    return {"status": "ok", "service": "qms-backend"}
