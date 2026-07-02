from flask import Blueprint, jsonify, session,request
from services import load_messages,park_in_msg,park_out_msg,parking_record_to_dict,delete_message
from models import get_latest_record

saved_msg_bp = Blueprint('saved-msg',__name__)

@saved_msg_bp.post("/")
def get_saved_msg():
    data = load_messages()

    if not data:
        return jsonify({
            "status": "error",
            "message": "No saved messages found."
        }), 404

    return jsonify({
        "status": "success",
        "message": "Saved messages retrieved successfully.",
        "data": data
    }), 200

@saved_msg_bp.post("/get-message-details")
def get_vehicle_details():
    data = request.get_json()

    vehicle_no = data.get("vehicle_no")

    if not vehicle_no:
        return jsonify({
            "status": "error",
            "message": "Vehicle number is required."
        }), 400

    result = get_latest_record(vehicle_no)

    if not result:
        return jsonify({
            "status": "error",
            "message": "Vehicle not found."
        }), 404

    record, phone = get_latest_record(vehicle_no)

    return jsonify({
        "status": "success",
        "message": "Vehicle details retrieved successfully.",
        "data": parking_record_to_dict(record, phone)
    }), 200

@saved_msg_bp.post("/send-saved-msg")
def send_saved_msg():
    data = request.get_json()
    vehicle_no = data.get("vehicle_no","")
    status = data.get("park_out_status",False)
    if not status:
        response = park_in_msg(vehicle_no)
        if response.get("status")=="error":
            return jsonify(response), 500
        elif(not delete_message(vehicle_no,status)):
            return jsonify({"status":"error","message":"Server error while deleting messages."}), 500
        return jsonify(response), 200
    else:
        response = park_out_msg(vehicle_no)
        if response.get("status")=="error":
            return jsonify(response), 500
        elif(not delete_message(vehicle_no,status)):
            return jsonify({"status":"error","message":"Server error while deleting messages."}), 500
        return jsonify(response), 200