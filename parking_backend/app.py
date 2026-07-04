from flask import Flask
from flask_cors import CORS
from config import Config
from database import db_session,init_db
from routes import park_in_bp,park_out_bp,saved_msg_bp,login_bp,dashboard_bp
from services import seed_dashboard


app = Flask(__name__)
app.config.from_object(Config)

CORS(app, supports_credentials=True)
init_db()

app.register_blueprint(park_in_bp, url_prefix="/api/park-in")
app.register_blueprint(park_out_bp, url_prefix="/api/park-out")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(saved_msg_bp, url_prefix="/api/saved-msg")
app.register_blueprint(login_bp,url_prefix="/api/login")

seed_dashboard()


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


if __name__ == "__main__":
    app.run(debug=True)