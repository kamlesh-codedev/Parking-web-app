from models import park_out, check_stats, get_park_in, update_due, get_latest_record
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import inch
from datetime import datetime
from reportlab.graphics.barcode import code128
from reportlab.lib.units import cm
from services.send_msg import send, save_message
from services.print_bill import auto_print_pdf
from services.pdf_handling import delete_invoice
import pyautogui
import time

def park_out_generate(vehicle_no):
    vehicle_no = str(vehicle_no).strip().upper()

    if check_stats(vehicle_no):
        response = {"status":"no_data",
                    "message":"No Vehicle data found."}
        return response
    
    record,ph = get_park_in(vehicle_no)
    
    park_out_time = datetime.now()
    park_in_time = record.park_in_date
    daily_amount = record.amount or 0
    prepaid = record.prepaid or 0
    duration_days = (park_out_time.date() - park_in_time.date()).days + 1
    parking_fee = duration_days * daily_amount
    fee_to_pay = parking_fee - prepaid
    if not park_out(record,park_out_time,duration_days,fee_to_pay):
        response = {"status":"error",
                    "message":"Error fetching the DataBase."}
        return response
    response = {
        "status": "success",
        "message": "Vehicle parked out successfully.",
        "vehicle_no": record.vehicle_no,
        "vehicle_name": record.vehicle_name,
        "bill_no": record.bill_no,
        "park_in": str(record.park_in_date.strftime('%d-%m-%Y %I:%M %p')),
        "park_out": str(park_out_time.strftime('%d-%m-%Y %I:%M %p')),
        "entry_time":str(record.park_in_date.strftime('%d-%m-%Y %I:%M %p')),
        "exit_time": str(park_out_time.strftime('%d-%m-%Y %I:%M %p')),
        "no_of_days": duration_days,
        "daily_amount": daily_amount,
        "prepaid": prepaid,
        "parking_fee": fee_to_pay,
        "phone_number":ph,
        "phone": ph,
        "total_amount": fee_to_pay,
        "parking_status":"parked",
    }
    return response

def payment_update(vehicle_no,amount_paid):

    record, ph = get_latest_record(vehicle_no)
    if not record:
        response = {"status":"error",
                    "message":"Error in database server."}
        return response
    
    amount_due = record.park_fee - amount_paid
    
    if not update_due(record, amount_due):
        response = {"status":"error",
                    "message":"Error in database server."}
        return response

    pdf_path = park_out_pdf(record,amount_due)
    if not pdf_path:
        response = {"status":"error",
                    "message":"Error in creating PDF."}
        return response
    
    if not auto_print_pdf(pdf_path):
        response = {"status":"error",
                    "message":"Error in printing PDF."}
        return response
    
    time.sleep(3)
    pyautogui.press('win')
    time.sleep(2)
    pyautogui.write('Messages')
    time.sleep(2)
    pyautogui.press('enter')
    
    response={"status":"success",
              "message":"Parking saved and printed successfully!"}
    return response
    
def park_out_pdf(record,amount_due):
    out_invoice_path_pdf = os.path.join("parking_records", f"Out_invoice_{record.vehicle_no}.pdf")  
    PAGE_WIDTH = 4 * inch
    PAGE_HEIGHT = 6* inch

    c = canvas.Canvas(out_invoice_path_pdf, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

    y = PAGE_HEIGHT - 1*cm

    y -= 15
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, "-" *50)
    y -= 15

    c.setFont("Times-Bold", 17)
    c.drawCentredString(PAGE_WIDTH / 2, y, "INVOICE")
    
    y -= 15
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, "-" *50)
    y -= 18
    c.drawString(0.5*cm, y, f"Vehicle No   : {record.vehicle_no}")
    y -= 15
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, f"Time OUT     : {record.park_out.strftime('%d-%m-%Y %I:%M %p')}")
    y -= 18
    c.drawString(0.5*cm, y, f"Duration        : {record.no_of_days} day(s)")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, f"Parking Fee  : Rs.{record.park_fee}/-")
    y -= 18
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, f"Amount Due  : Rs.{amount_due}/-")
    y -= 18
    c.drawString(0.5*cm, y, "-"*50)
    c.save()
    return out_invoice_path_pdf

def park_out_msg(vehicle_no,save=False):
    record,ph = get_latest_record(vehicle_no)
    if not record:
        response = {"status":"error",
                    "message":"Vehicle not found"}
        return response
    
    message = (
        "K&K PARKING, ARANI\n"
        "-------------------------------------\n"
        "                   INVOICE\n"
        "-------------------------------------\n"
        f"Vehicle Name    : {record.vehicle_name}\n"
        f"Vehicle Number  : {record.vehicle_no}\n"
        f"Park In Time    : {record.park_in_date.strftime('%d-%m-%Y %I:%M %p')}\n"
        f"Park Out Time   : {record.park_out.strftime('%d-%m-%Y %I:%M %p')}\n"
        f"Total Duration  : {record.no_of_days} day(s)\n"
        f"Parking Fee     : Rs.{record.park_fee + record.prepaid}/-\n"
        f"Amount Paid     : Rs.{record.park_fee + record.prepaid - record.amount_due}/-\n"
        f"Prepaid Amount  : Rs.{record.prepaid}/-\n"
        f"Amount Due      : Rs.{record.amount_due}/-\n"
        f"Bill Number     : {record.bill_no}\n"
        "-------------------------------------\n"
        "Whatsapp & Gpay ph: 9444718580\n"
        "-------------------------------------\n"
        "Thank you! visit again.\n"
        "-------------------------------------\n"
    )
    if save:
        if not save_message(message,ph):
            response = {"status":"error",
                        "message":"Error saving message in server."}
            return response
        response = {"status":"success",
                    "message":"Successfully saved message!"}
        return response
    elif not send(ph,message):
        response = {"status":"error",
                    "message":"Server issue while sending message."}
        return response
    pdf_path = os.path.join("parking_records", f"Invoice_{record.vehicle_no}.pdf")
    if os.path.exists(pdf_path):
        if not delete_invoice(pdf_path):
            response = {"status":"error",
                        "message":"Server issue while deleting PDFs."}
            return response
    response = {"status":"success",
                "message":"Message send successfully!"}
    return response