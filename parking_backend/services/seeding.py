from datetime import datetime, timedelta
import random

from database.db_initilize import db_session
from models.db_operation import ParkingRecord


VEHICLES = [
    "Honda Activa",
    "TVS Jupiter",
    "Suzuki Access",
    "Hero Splendor",
    "Royal Enfield",
    "Bajaj Pulsar",
    "Hyundai i20",
    "Maruti Swift",
    "Tata Nexon",
    "Kia Seltos",
]


def seed_dashboard():
    # Clear old records (Optional)
    db_session.query(ParkingRecord).delete()

    now = datetime.now()

    bill = 1000

    # Generate last 20 days
    for day in range(20):

        current_date = now - timedelta(days=day)

        # Random vehicles each day
        vehicle_count = random.randint(8, 20)

        for i in range(vehicle_count):

            park_in_hour = random.randint(7, 21)

            park_in = current_date.replace(
                hour=park_in_hour,
                minute=random.randint(0, 59),
                second=0,
                microsecond=0,
            )

            vehicle_no = f"TN01AB{random.randint(1000,9999)}"

            vehicle_name = random.choice(VEHICLES)

            amount = random.choice([20, 30, 40, 50, 60, 80, 100])

            prepaid = random.choice([0, amount])

            park_fee = amount

            amount_due = max(0, amount - prepaid)

            # About 20% still parked
            if random.random() < 0.20:
                park_out = None
            else:
                park_out = park_in + timedelta(
                    hours=random.randint(1, 12),
                    minutes=random.randint(0, 59),
                )

            record = ParkingRecord(
                park_in_date=park_in,
                bill_no=f"PK26-{bill}",
                vehicle_no=vehicle_no,
                vehicle_name=vehicle_name,
                no_of_days=1,
                park_out=park_out,
                amount=amount if park_out else None,
                prepaid=prepaid,
                park_fee=park_fee,
                amount_due=amount_due,
            )

            db_session.add(record)

            bill += 1

    db_session.commit()

    print("Dashboard sample data inserted successfully.")


if __name__ == "__main__":
    seed_dashboard()