import os
from datetime import datetime

COUNTER_FILE = "counter.txt"
MAX_BILL = 300


def get_bill_number():
    """
    Returns the next bill number.
    Example:
    PK26-06-001
    """

    year = datetime.now().strftime("%y")
    month = datetime.now().strftime("%m")

    # Create file if it doesn't exist
    if not os.path.exists(COUNTER_FILE):
        with open(COUNTER_FILE, "w") as f:
            f.write(f"{year},{month},001")

    # Read counter
    with open(COUNTER_FILE, "r") as f:
        saved_year, saved_month, bill = f.read().strip().split(",")

    bill = int(bill)

    # Reset if month/year changed
    if saved_year != year or saved_month != month:
        bill = 1

    # Current bill to return
    bill_number = f"PK{year}-{month}-{bill:03d}"

    # Prepare next bill
    bill += 1
    if bill > MAX_BILL:
        bill = 1

    # Save updated counter
    with open(COUNTER_FILE, "w") as f:
        f.write(f"{year},{month},{bill:03d}")

    return bill_number


def reset_counter():
    """
    Manually reset counter to 001.
    """

    year = datetime.now().strftime("%y")
    month = datetime.now().strftime("%m")

    with open(COUNTER_FILE, "w") as f:
        f.write(f"{year},{month},001")