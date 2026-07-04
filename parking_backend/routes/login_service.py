from flask import Flask, Blueprint, jsonify, session, request   # ADD "Flask" to this import
from flask_cors import CORS                                      # ADD THIS WHOLE LINE

app = Flask(__name__)                                             # ADD THIS WHOLE LINE
CORS(app, origins=["http://localhost:5173"])                      # ADD THIS WHOLE LINE

login_bp = Blueprint('login',__name__)

@login_bp.post('')
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

app.register_blueprint(login_bp, url_prefix="/login")             # ADD THIS WHOLE LINE

if __name__ == "__main__":                                        # ADD THIS WHOLE LINE
    app.run(debug=True, port=5000)                                # ADD THIS WHOLE LINE