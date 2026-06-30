from flask import Blueprint, jsonify, session, request
from services import park_out_preview, park_out_generate, park_out_msg, payment_update
from models import get_currently_parked_vehicle_numbers

park_out_bp = Blueprint('park-out', __name__)


@park_out_bp.post('/')
def get_vehicle_numbers():
    vehicle_list = get_currently_parked_vehicle_numbers()
    if not vehicle_list:
        return jsonify({"status":"error",
                        "message":"No vehicles currently parked."}), 404
    return jsonify({"status":"success",
                    "vehicle_list":vehicle_list}), 200

# ── Search: preview only, no DB write ────────────────────────
@park_out_bp.route('/generate-bill', methods=['POST'])
def generate_bill():
    data = request.get_json()
    vehicle_no = data.get("vehicle_number")
    vehicle_no = str(vehicle_no).strip().upper()
    session["vehicle_no"]=vehicle_no
    if not vehicle_no:
        return jsonify({"status":"error",
                        "message":"Empty Vehicle Number"}), 401
    response = park_out_generate(vehicle_no)
    if response.get("status")=="error":
        return jsonify(response), 500
    elif response.get("status")=="no_data":
        return jsonify(response), 401
    else:
        return jsonify(response), 200


# ── Payment: commits DB, generates PDF, prints ────────────────
@park_out_bp.post('/payment')
def process_payment():
    data = request.get_json()
    vehicle_no = data.get("vehicle_no","")
    if vehicle_no != session.get("vehicle_no",""):
        return jsonify({"status":"error",
                        "message":"Unable to get Vehicle Number"}), 400
    amount_paid = data.get("amount_paid")

    # Step 1: commit park-out to DB
    checkout = park_out_generate(vehicle_no)
    if checkout.get("status") != "success":
        return jsonify(checkout), 500

    # Step 2: record amount paid / due
    response = payment_update(vehicle_no, amount_paid)
    if response.get("status") == "error":
        return jsonify(response), 500

    return jsonify(response), 200


@park_out_bp.post('/send-msg')
def send_message():
    response = park_out_msg(session.get("vehicle_no"))
    if response.get("status")=="error":
        return jsonify(response), 500
    return jsonify(response), 200


@park_out_bp.post('/save-msg')
def save_message():
    response = park_out_msg(session.get("vehicle_no"),True)
    if response.get("status")=="error":
        return jsonify(response), 500
    return jsonify(response), 200