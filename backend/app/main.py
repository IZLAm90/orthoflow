from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    users,
    patients,
    doctors,
    delivery_centers,
    products,
    cases,
    orders,
    invoices,
    lab_orders,
    calendar,
    company,
    notifications,
)

app = FastAPI(title="OrthoFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(delivery_centers.router)
app.include_router(products.router)
app.include_router(cases.router)
app.include_router(orders.router)
app.include_router(invoices.router)
app.include_router(lab_orders.router)
app.include_router(calendar.router)
app.include_router(company.router)
app.include_router(notifications.router)


@app.get("/health")
def health():
    return {"status": "ok"}
