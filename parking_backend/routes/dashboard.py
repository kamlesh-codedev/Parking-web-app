from flask import Blueprint, jsonify, session,request
from services import get_dashboard_data

dashboard_bp = Blueprint('dashboard',__name__)


dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/", methods=["GET"])
def dashboard_stats():
    return jsonify(get_dashboard_data()), 200