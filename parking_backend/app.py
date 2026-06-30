from flask import Flask
from flask_cors import CORS
from config import Config
from database import db_session,init_db
from routes import park_in_bp,park_out_bp,saved_msg_bp


app = Flask(__name__)
app.config.from_object(Config)

CORS(app, supports_credentials=True)
init_db()

app.register_blueprint(park_in_bp, url_prefix="/park-in")
app.register_blueprint(park_out_bp, url_prefix="/park-out")
# app.register_blueprint(data_fetch_bp, url_prefix="/get-stats")
app.register_blueprint(saved_msg_bp, url_prefix="/saved-msg")


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


if __name__ == "__main__":
    app.run(debug=True)