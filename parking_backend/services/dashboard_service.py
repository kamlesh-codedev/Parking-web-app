from datetime import datetime, timedelta
from sqlalchemy import func

from database import db_session
from models import ParkingRecord


def get_dashboard_data():
    now = datetime.now()

    # -----------------------------
    # Time Ranges
    # -----------------------------
    today_start = datetime(now.year, now.month, now.day)
    tomorrow_start = today_start + timedelta(days=1)

    # Current month (1st day -> now)
    month_start = datetime(now.year, now.month, 1)

    # Current week (Monday -> Sunday)
    week_start = today_start - timedelta(days=today_start.weekday())
    week_end = week_start + timedelta(days=7)

    # -----------------------------
    # 1. Today's Parked Vehicles
    # -----------------------------
    today_parked = (
        db_session.query(func.count(ParkingRecord.id))
        .filter(
            ParkingRecord.park_in_date >= today_start,
            ParkingRecord.park_in_date < tomorrow_start,
        )
        .scalar()
        or 0
    )

    # -----------------------------
    # 2. Currently Parked Vehicles
    # -----------------------------
    currently_parked = (
        db_session.query(func.count(ParkingRecord.id))
        .filter(ParkingRecord.park_out == None)
        .scalar()
        or 0
    )

    # -----------------------------
    # 3. Today's Revenue
    # -----------------------------
    today_revenue = (
        db_session.query(func.sum(ParkingRecord.amount))
        .filter(
            ParkingRecord.park_out >= today_start,
            ParkingRecord.park_out < tomorrow_start,
        )
        .scalar()
        or 0
    )

    # -----------------------------
    # 4. This Month Revenue
    # -----------------------------
    month_revenue = (
        db_session.query(func.sum(ParkingRecord.amount))
        .filter(
            ParkingRecord.park_out != None,
            ParkingRecord.park_out >= month_start,
        )
        .scalar()
        or 0
    )

    # -----------------------------
    # Weekly Park-In
    # -----------------------------
    parkin_rows = (
        db_session.query(
            func.date(ParkingRecord.park_in_date),
            func.count(ParkingRecord.id),
        )
        .filter(
            ParkingRecord.park_in_date >= week_start,
            ParkingRecord.park_in_date < week_end,
        )
        .group_by(func.date(ParkingRecord.park_in_date))
        .all()
    )

    # -----------------------------
    # Weekly Park-Out
    # -----------------------------
    parkout_rows = (
        db_session.query(
            func.date(ParkingRecord.park_out),
            func.count(ParkingRecord.id),
        )
        .filter(
            ParkingRecord.park_out != None,
            ParkingRecord.park_out >= week_start,
            ParkingRecord.park_out < week_end,
        )
        .group_by(func.date(ParkingRecord.park_out))
        .all()
    )

    # Convert query results to dictionaries
    parkin_dict = {str(day): count for day, count in parkin_rows}
    parkout_dict = {str(day): count for day, count in parkout_rows}

    # -----------------------------
    # Build Monday -> Sunday data
    # -----------------------------
    weekly = []

    for i in range(7):
        current_day = week_start + timedelta(days=i)
        date_key = current_day.date().isoformat()

        weekly.append({
            "day": current_day.strftime("%A"),
            "park_in": parkin_dict.get(date_key, 0),
            "park_out": parkout_dict.get(date_key, 0)
        })

    return {
        "today_parked": today_parked,
        "currently_parked": currently_parked,
        "today_revenue": float(today_revenue),
        "month_revenue": float(month_revenue),
        "weekly": weekly,
    }