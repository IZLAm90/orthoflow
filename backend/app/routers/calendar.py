from datetime import datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("", response_model=list[schemas.CalendarEvent])
def list_calendar_events(db: Session = Depends(get_db)):
    """Derived feed: no calendar_events table exists — events are order delivery
    dates and lab order ETAs reshaped into calendar entries, mirroring how the
    reference platform's calendar is generated from order data rather than
    stored directly."""
    events: list[schemas.CalendarEvent] = []

    orders = db.query(models.Order).filter(models.Order.delivery_on.isnot(None)).all()
    for order in orders:
        patient_name = f"{order.patient.first_name} {order.patient.last_name}" if order.patient else "—"
        verb = "Delivered" if order.status == "finished" else "Order"
        events.append(
            schemas.CalendarEvent(
                id=f"order-{order.id}",
                category="orders",
                date=order.delivery_on,
                title=f"{verb}: {patient_name}",
                ref=order.ref,
                url=f"/orders",
            )
        )

    lab_orders = db.query(models.LabOrder).filter(models.LabOrder.eta.isnot(None)).all()
    for lo in lab_orders:
        events.append(
            schemas.CalendarEvent(
                id=f"lab-{lo.id}",
                category="lab",
                date=datetime.combine(lo.eta, time.min),
                title=f"Lab: {lo.lab or 'Lab'} order",
                ref=lo.ref,
                url="/lab",
            )
        )

    return events
