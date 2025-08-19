from pydantic import BaseModel, Field
from datetime import datetime

class EventBase(BaseModel):
    event_type: str = Field(..., examples=["Deviation","CAPA","Change Control","Audit"])
    title: str
    description: str
    department: str
    initiator: str
    status: str = Field(..., examples=["Open","In-Progress","Closed"])
    severity: str = Field(..., examples=["Low","Medium","High","Critical"])
    priority: str = Field(..., examples=["Low","Medium","High"])
    due_date: datetime | None = None
    attachments: str | None = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    event_type: str | None = None
    title: str | None = None
    description: str | None = None
    department: str | None = None
    initiator: str | None = None
    status: str | None = None
    severity: str | None = None
    priority: str | None = None
    due_date: datetime | None = None
    attachments: str | None = None

class EventOut(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# AI
class AIQuery(BaseModel):
    action: str  # "high_risk" | "summarize_open_last_month" | "suggest_next_steps" | "capa_trends" | "closure_draft"
    event_id: int | None = None
    timeframe_days: int | None = 30
