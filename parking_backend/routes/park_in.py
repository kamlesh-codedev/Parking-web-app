from flask import Blueprint, jsonify, session,request
from services import park_in_generate,park_in_msg,get_bill_number
from models import get_vehicle_info

park_in_bp = Blueprint('park-in',__name__)

@park_in_bp.route('/get-details',methods=['GET'])
def get_vehicle_details():
    vehicle_no = request.args.get("vehicle_no")
    vehicle_no = str(vehicle_no).upper()
    session["vehicle_no"] = vehicle_no
    if not vehicle_no:
        return jsonify({"status":"errror",
                    "message":"Empty Vehicle Number"}), 401
    vehicle_no = vehicle_no.strip()
    details = get_vehicle_info(vehicle_no)
    if not details:
        return jsonify({"status":"error",
                        "message":"No Vehicle data found."}), 401
    return jsonify({
    "status": "success",
    "message": {
        "vehicle_number": details.vehicle_no,
        "vehicle_name": details.vehicle_name,
        "amount": details.amount,
        "phone_number": details.phone_number,
    }}), 200

@park_in_bp.route('/generate-bill', methods=['POST'])
def generate_bill():
    if "vehicle_no" not in session:
        return jsonify({"status":"error",
                        "message":"Unauthorized Logic please login again"}), 401
    data = request.get_json()
    if session.get("vehicle_no")!=str(data.get("vehicle_no")).upper():
        return jsonify({"status":"error",
                        "message":"Unable to get Vehicle Number"})
    vehicle_no = session.get("vehicle_no")
    vehicle_name = data.get("vehicle_name")
    amount = data.get("amount")
    prepaid = data.get("prepaid")
    ph_no = data.get("phone_number")
    bill_no = get_bill_number()
    response = park_in_generate(bill_no,vehicle_no,vehicle_name,amount,prepaid,ph_no)
    if response.get("status")=="error":
        return jsonify(response), 500
    elif response.get("status") == "reserved":
        return jsonify(response), 409
    else:
        return jsonify(response), 200

@park_in_bp.post('/send-msg')
def send_message():
    response = park_in_msg(session.get("vehicle_no"))
    if response.get("status")=="error":
        return jsonify(response), 500
    return jsonify(response), 200

@park_in_bp.post('/save-msg')
def save_message():
    response = park_in_msg(session.get("vehicle_no"),True)
    if response.get("status")=="error":
        return jsonify(response), 500
    return jsonify(response), 200