from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timedelta
from . import models, schemas

# Create
def create_event(db: Session, payload: schemas.EventCreate) -> models.Event:
    obj = models.Event(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

# Read list with simple filters
def list_events(db: Session, status: str | None = None, severity: str | None = None, event_type: str | None = None):
    stmt = select(models.Event)
    if status:
        stmt = stmt.where(models.Event.status == status)
    if severity:
        stmt = stmt.where(models.Event.severity == severity)
    if event_type:
        stmt = stmt.where(models.Event.event_type == event_type)
    stmt = stmt.order_by(models.Event.created_at.desc())
    return db.scalars(stmt).all()

# Read one
def get_event(db: Session, event_id: int) -> models.Event | None:
    return db.get(models.Event, event_id)

# Update
def update_event(db: Session, event_id: int, payload: schemas.EventUpdate):
    obj = db.get(models.Event, event_id)
    if not obj:
        return None
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

# Delete
def delete_event(db: Session, event_id: int) -> bool:
    obj = db.get(models.Event, event_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

# --- Helpers for “AI” features (DB-side analytics) ---
def high_risk_events(db: Session):
    # "High risk" => severity High or Critical OR overdue Open items
    now = datetime.utcnow()
    stmt = select(models.Event).where(
        (models.Event.severity.in_(["High", "Critical"])) |
        ((models.Event.status != "Closed") & (models.Event.due_date != None) & (models.Event.due_date < now))
    ).order_by(models.Event.due_date.asc().nulls_last())
    return db.scalars(stmt).all()

def open_events_last_month(db: Session, days: int = 30):
    since = datetime.utcnow() - timedelta(days=days)
    stmt = select(models.Event).where(
        (models.Event.status != "Closed") & (models.Event.created_at >= since)
    ).order_by(models.Event.created_at.desc())
    return db.scalars(stmt).all()

def capa_trends(db: Session):
    # simple count by status/severity for CAPA type
    stmt = select(models.Event.status, models.Event.severity, func.count()).where(
        models.Event.event_type.ilike("%CAPA%")
    ).group_by(models.Event.status, models.Event.severity).order_by(func.count().desc())
    rows = db.execute(stmt).all()
    return [{"status": s, "severity": sev, "count": c} for (s, sev, c) in rows]
