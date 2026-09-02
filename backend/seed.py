from app import models
from app.database import SessionLocal, Base, engine
from app.security import hash_password

Base.metadata.create_all(bind=engine)


def run():
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            admin = models.User(
                name="Admin",
                email="admin@orthoflow.app",
                password_hash=hash_password("Admin123!"),
                role="admin",
                status="active",
            )
            db.add(admin)
            print("Seeded admin user -> email: admin@orthoflow.app  password: Admin123!")

        if db.query(models.Doctor).count() == 0:
            db.add_all(
                [
                    models.Doctor(name="Dr. Sarah Mitchell", email="sarah.mitchell@orthoflow.app", phone="+1-555-0101"),
                    models.Doctor(name="Dr. David Park", email="david.park@orthoflow.app", phone="+1-555-0102"),
                ]
            )

        if db.query(models.DeliveryCenter).count() == 0:
            db.add_all(
                [
                    models.DeliveryCenter(name="Main Clinic", address="123 Ortho Ave", phone="+1-555-0200"),
                    models.DeliveryCenter(name="Downtown Branch", address="456 Smile St", phone="+1-555-0201"),
                ]
            )

        if db.query(models.Product).count() == 0:
            db.add_all(
                [
                    models.Product(name="Clear Aligner Standard", provider="AlignTech", price=50.00, rating=4.5, description="Standard clear aligner treatment."),
                    models.Product(name="Clear Aligner Premium", provider="AlignTech", price=85.00, rating=4.8, description="Premium clear aligner with faster turnaround."),
                    models.Product(name="Retainer Set", provider="RetainCo", price=30.00, rating=4.2, description="Post-treatment retainer set."),
                ]
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
