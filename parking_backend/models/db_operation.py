from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String
from database import db_session
from models import Base
from services.pdf_handling import delete_invoice
import os


class ParkingRecord(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    park_in_date = Column(DateTime, nullable=False)
    bill_no = Column(String(50), nullable=False)
    vehicle_no = Column(String(50), nullable=False)
    vehicle_name = Column(String(100), nullable=False)
    no_of_days = Column(Integer, nullable=True)
    park_out = Column(DateTime, nullable=True)
    amount = Column(Float, nullable=True)
    prepaid = Column(Float, nullable=True)
    park_fee = Column(Float, nullable=True)
    amount_due = Column(Float, nullable=True)

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_no = Column(String(50), nullable=False, unique=True)
    vehicle_name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=True)
    phone_number = Column(String(20), nullable=True)

def get_currently_parked_vehicle_numbers():
    return [
        row.vehicle_no
        for row in db_session.query(ParkingRecord.vehicle_no)
        .filter(ParkingRecord.park_out.is_(None))
        .all()
    ]

def get_vehicle_info(vehicle_no):
    return db_session.query(Vehicle).filter(
        Vehicle.vehicle_no == vehicle_no
    ).first()

def update_vehicle_info(vehicle_no, vehicle_name, amount, phone_number):
    vehicle = db_session.query(Vehicle).filter(
        Vehicle.vehicle_no == vehicle_no
    ).first()

    vehicle.vehicle_name = vehicle_name
    vehicle.amount = amount
    vehicle.phone_number = phone_number
    db_session.commit()
    return True

def create_vehicle_info(vehicle_no, vehicle_name, amount, phone_number):
    vehicle = Vehicle(
            vehicle_no=vehicle_no,
            vehicle_name=vehicle_name,
            amount=amount,
            phone_number=phone_number,
        )
    db_session.add(vehicle)
    db_session.commit()
    return True

def check_stats(vehicle_no):
    parked_in = db_session.query(ParkingRecord).filter(
        ParkingRecord.vehicle_no == vehicle_no,
        ParkingRecord.park_out == None
    ).first()

    if parked_in:
        return False

    previous_record = db_session.query(ParkingRecord).filter(
    ParkingRecord.vehicle_no == vehicle_no,
    ParkingRecord.park_out != None
    ).first()

    if previous_record:
        pdf_path = os.path.join(
            "parking_records",
            f"Out_invoice_{vehicle_no}.pdf"
        )
        if not delete_invoice(pdf_path):
            return False
        db_session.delete(previous_record)
        
    db_session.commit()
    return True

def park_in(bill_no, vehicle_no, vehicle_name, amount, prepaid, amount_due=None, park_in_date=None):
    record = ParkingRecord(
        park_in_date=park_in_date or datetime.now(),
        bill_no=bill_no,
        vehicle_no=vehicle_no,
        vehicle_name=vehicle_name,
        amount=amount,
        prepaid=prepaid,
        amount_due=amount_due,
        park_out=None,
    )

    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)

    return True

def get_park_in(vehicle_no):
    record = (
        db_session.query(ParkingRecord)
        .filter(
            ParkingRecord.vehicle_no == vehicle_no,
            ParkingRecord.park_out == None
        )
        .first()
    )

    if not record:
        return 0,0
    return record,"1234567890"

    vehicle = (
        db_session.query(Vehicle)
        .filter(Vehicle.vehicle_no == vehicle_no)
        .first()
    )

    ph = vehicle.phone_number

    return record,ph

def park_out(record,park_out_time,duration_days,parking_fee):
    record.park_out = park_out_time
    record.no_of_days = duration_days
    record.park_fee = parking_fee

    db_session.commit()
    db_session.commit()
    db_session.refresh(record)
    return True

def update_due(record,amount_due):
    record.amount_due = amount_due
    db_session.commit()
    db_session.commit()
    db_session.refresh(record)
    return True

def get_latest_record(vehicle_no):
    record = (
        db_session.query(ParkingRecord)
        .filter(ParkingRecord.vehicle_no == vehicle_no)
        .order_by(ParkingRecord.id.desc())
        .first()
    )

    if not record:
        return False

    vehicle = db_session.query(Vehicle).filter(
        Vehicle.vehicle_no == vehicle_no
    ).first()

    ph = vehicle.phone_number if vehicle else None
    return record, ph

def get_all_records():
    return db_session.query(ParkingRecord).order_by(ParkingRecord.id.desc()).all()