from flask import Blueprint, jsonify, session,request

login_bp = Blueprint('login',__name__)

@login_bp.post('/')
def check_login():
    data = request.get_json()
    try:
        username = data.get("username")
        password = data.get("password")
        if username=="Admin" and password=="Access@2026":
            return jsonify({"status":"success",
                            "message":"Logged in successfully."}),200
        else:
            return jsonify({"status":"error",
                            "message":"Invalid Username or Password"}),404
    except:
        return jsonify({"status":"error",
                        "message":"Error receving the datas."}),404