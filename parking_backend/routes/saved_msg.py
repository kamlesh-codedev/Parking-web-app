from flask import Blueprint, jsonify, session,request
from services import load_and_clear

saved_msg_bp = Blueprint('saved-msg',__name__)

@saved_msg_bp.post("/get-messages")
def get_saved_msg():
    data = load_and_clear(load=True)
    if not data:
        return jsonify({"status":"error",
                        "message":"No Saved message found"}), 401
    return jsonify({"status":"success",
                    "message":"Saved messages retrived successfully.",
                    "data":[
                        {
                            "phone": item["phone"],
                            "message": item["message"]
                        }
                        for item in data
                    ]
                    }),200

@saved_msg_bp.post("/send-saved-msg")
def send_saved_msg():
    data = request.get_json()
    phone_no = data.get("phone_no")
    if not phone_no:
        return jsonify({"status":"error",
                        "message":"Empty phone number."}), 401
    if not load_and_clear(phone_no=phone_no):
        return jsonify({"status":"error",
                        "message":"Server error while sending messages"}), 500
    return jsonify({"status":"success",
                    "message":"Message send successfully."}), 200