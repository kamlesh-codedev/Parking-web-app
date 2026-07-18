from flask import Flask, send_from_directory
import os
from flask_cors import CORS
from config import Config
from database import db_session,init_db
from routes import park_in_bp,park_out_bp,saved_msg_bp,login_bp,dashboard_bp
from services import seed_user


frontend_dist = os.path.join(
    os.path.dirname(__file__),
    "..",
    "parking_frontend",
    "dist"
)

app = Flask(
    __name__,
    static_folder=frontend_dist,
    static_url_path=""
)
app.config.from_object(Config)

CORS(app, supports_credentials=True)
init_db()

app.register_blueprint(park_in_bp, url_prefix="/api/park-in")
app.register_blueprint(park_out_bp, url_prefix="/api/park-out")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(saved_msg_bp, url_prefix="/api/saved-msg")
app.register_blueprint(login_bp,url_prefix="/api/login")

seed_user()

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def serve_react(path):
    file_path = os.path.join(app.static_folder, path)

    if os.path.exists(file_path):
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, "index.html")

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)