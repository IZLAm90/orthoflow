from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Wording mirrors the reference platform's own notification feed.
PHASE_MESSAGE = {
    "Order Placed": "requires a treatment plan review",
    "Order Accepted": "was accepted by the manufacturer",
    "Shipping": "has been delivered",
}


@router.get("", response_model=list[schemas.NotificationItem])
def list_notifications(db: Session = Depends(get_db)):
    """Derived feed: no notifications table exists — entries are order phase
    transitions and treatment plan observations reshaped into notifications,
    the same way the calendar feed is derived from order data."""
    items: list[schemas.NotificationItem] = []

    phases = db.query(models.OrderPhase).join(models.Order).all()
    for phase in phases:
        order = phase.order
        verb = PHASE_MESSAGE.get(phase.title, phase.title.lower())
        items.append(
            schemas.NotificationItem(
                id=f"phase-{phase.id}",
                message=f"Order {order.ref} {verb}!",
                order_ref=order.ref,
                created_at=phase.created_at,
            )
        )

    observations = db.query(models.Observation).join(models.Order).all()
    for obs in observations:
        order = obs.order
        items.append(
            schemas.NotificationItem(
                id=f"obs-{obs.id}",
                message=f"Order {order.ref} has a new message!",
                order_ref=order.ref,
                created_at=obs.created_at,
            )
        )

    items.sort(key=lambda n: n.created_at, reverse=True)
    return items[:50]
