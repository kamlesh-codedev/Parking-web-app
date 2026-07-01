def parking_record_to_dict(record, phone):
    return {
        "bill_no": record.bill_no,
        "vehicle_no": record.vehicle_no,
        "vehicle_name": record.vehicle_name,
        "phone_number": phone,
        "park_in_date": record.park_in_date.isoformat() if record.park_in_date else None,
        "park_out": record.park_out.isoformat() if record.park_out else None,
        "no_of_days": record.no_of_days,
        "amount": record.amount,
        "prepaid": record.prepaid,
        "park_fee": record.park_fee,
        "amount_due": record.amount_due
    }