# later, when created:
# from routes.park_out import park_out_bp
# from routes.data_fetch import data_fetch_bp
# from routes.saved_msg import saved_msg_bp

from services.vehicle_in import park_in_generate, park_in_msg
from services.vehicle_out import park_out_generate, park_out_msg, payment_update
from services.send_msg import send, save_message,load_messages,delete_message
from services.print_bill import auto_print_pdf
from services.get_bill_no import get_bill_number
from services.pdf_handling import delete_invoice
from services.formatting_func import parking_record_to_dict