from flask import Flask, Blueprint, jsonify, session, request   
from flask_cors import CORS      
from services import authenticate_user,get_security_question,verify_security_answer,reset_password                         

app = Flask(__name__)                                             
CORS(app, origins=["http://localhost:5173"])                      

login_bp = Blueprint('login',__name__)

@login_bp.post('')
def check_login():
    data = request.get_json()
    try:
        username = data.get("username")
        password = data.get("password")
        if authenticate_user(username, password):
            session["username"]=username
            return jsonify({"status":"success",
                            "message":"Logged in successfully."}),200
        else:
            return jsonify({"status":"error",
                            "message":"Invalid Username or Password"}),401
    except:
            return jsonify({"status":"error",
                            "message":"Error receving the datas."}),404
    
@login_bp.post('/check-user')
def verify_user():
    data = request.get_json()
    username = data.get("username","")
    question = get_security_question(username)
    if not question:
         return jsonify({"status":"failed",
                         "messsage":"User Not found"}),404
    else:
         session["username"] = username
         return jsonify({"status":"success",
                         "question":question}),200

@login_bp.post('/reset-password')
def change_password():
    data = request.get_json()
    try:
        username = session.get("username")
        answer = data.get("answer")
        new_password = data.get("new-password")
        if verify_security_answer(username, answer):
            if reset_password(username, new_password):
                return jsonify({"status":"success",
                                "message":"Password changed Successfully"}),200
            else:
                 return jsonify({"status":"error",
                                 "message":"Server Error while changing password."}), 500
        else:
            return jsonify({"status":"failed",
                            "message":"Wrong or Invalid answer"}),404
    except Exception as e:
            return jsonify({"status":"error",
                            "message":str(e)}),404