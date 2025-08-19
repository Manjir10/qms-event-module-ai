from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from .database import Base

class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(50), index=True)  # Deviation/CAPA/Change/Audit/…
    title: Mapped[str] = mapped_column(String(150), index=True)
    description: Mapped[str] = mapped_column(Text)
    department: Mapped[str] = mapped_column(String(80), index=True)
    initiator: Mapped[str] = mapped_column(String(80), index=True)

    status: Mapped[str] = mapped_column(String(30), index=True)      # Open/In-Progress/Closed
    severity: Mapped[str] = mapped_column(String(30), index=True)    # Low/Medium/High/Critical
    priority: Mapped[str] = mapped_column(String(30), index=True)    # Low/Medium/High
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attachments: Mapped[str | None] = mapped_column(String(255), nullable=True)  # simple path/URL if needed
