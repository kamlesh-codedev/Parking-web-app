from sqlalchemy.orm import declarative_base

Base = declarative_base()

from models.db_operation import (
    ParkingRecord,
    Vehicle,
    get_vehicle_info,
    update_vehicle_info,
    create_vehicle_info,
    check_stats,
    park_in,
    get_park_in,
    park_out,
    get_all_records,
    update_due,
    get_latest_record,
    get_currently_parked_vehicle_numbers,
)