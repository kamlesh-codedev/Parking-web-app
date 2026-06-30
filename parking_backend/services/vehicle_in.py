from models import park_in,check_stats,get_vehicle_info,create_vehicle_info,update_vehicle_info,get_park_in
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import inch
from datetime import datetime
from reportlab.graphics.barcode import code128
from reportlab.lib.units import cm
from services.send_msg import send, save_message
from services.print_bill import auto_print_pdf
import pyautogui
import time

def park_in_generate(bill_no,vehicle_no,vehicle_name,amount,prepaid,ph_no):
    bill_no = str(bill_no)
    vehicle_no = str(vehicle_no).strip().upper()
    vehicle_name = str(vehicle_name).strip().upper()
    amount = int(amount)
    prepaid = int(prepaid)
    ph_no = str(ph_no).strip()
    amount_due = int(amount_due) if amount_due is not None else max(0, amount - prepaid)

    if not check_stats(vehicle_no):
        response = {"status":"reserved",
                    "message":"Vehicle already parked in."}
        return response
    
    if not park_in(bill_no,vehicle_no,vehicle_name,amount,prepaid,amount_due=amount_due):
        response = {"status":"db_error",
                    "message":"Error in database fetching."}
        return response
    
    if get_vehicle_info(vehicle_no):
        if not update_vehicle_info(vehicle_no,vehicle_name,amount,ph_no):
            response = {"status":"db_error",
                        "message":"Error in updating database."}
            return response
    else:
        if not create_vehicle_info(vehicle_no,vehicle_name,amount,ph_no):
            response = {"status":"db_error",
                        "message":"Error in creating records."}
            return response
    
    pdf_path = park_in_pdf(bill_no,vehicle_no,vehicle_name,amount,prepaid,ph_no)
    if not pdf_path:
        response = {"status":"pdf_error",
                    "message":"Error in creating PDF."}
        return response
    
    if not auto_print_pdf(pdf_path):
        response = {"status":"printing_error",
                    "message":"Error in printing PDF."}
        return response
    
    time.sleep(3)
    pyautogui.press('win')
    time.sleep(2)
    pyautogui.write('Messages')
    time.sleep(2)
    pyautogui.press('enter')
    
    response={"status":"success",
              "message":"Parking saved and printed successfully!",
              "bill_no":bill_no}
    return response
    
def park_in_pdf(bill_no,vehicle_no,vehicle_name,amount,prepaid,ph_no):
    invoice_path_pdf = os.path.join("parking_records", f"Invoice_{vehicle_no}.pdf")
    PAGE_WIDTH = 4 * inch
    PAGE_HEIGHT = 6* inch

    c = canvas.Canvas(invoice_path_pdf, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

    y = PAGE_HEIGHT - 1*cm

    c.setFont("Times-Bold", 17)
    c.drawCentredString(PAGE_WIDTH / 2, y, "K&K PARKING - ARANI")
    
    y -= 15
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, "-" *50)
    y -= 15
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, f"Vehice Name : {vehicle_name}")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, f"Vehicle No    : {vehicle_no}")
    y -= 18
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, f"Time IN          : {datetime.now().strftime('%d-%m-%Y %I:%M %p')}")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, f"Parking Fee  : Rs.{amount} for 24 hrs")
    y -= 18
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, f"Pre Paid          : Rs.{prepaid}/-")
    y -= 18
    c.drawString(0.5*cm, y, f"Bill No           : {bill_no}")
    y -= 18
    c.drawString(0.5*cm, y, f"Phone No       : {ph_no}")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, "-"*50)
    y -= 18
    c.setFont("Times-Bold", 17)
    c.drawString(0.5*cm, y, "Whatsapp & Gpay ph: 9444718580")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, "-"*50)
    y -= 18
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, "Keep this recipt safe & show in check-out")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, "-"*50)
    y -= 6
    c.setFont("Times-Bold",10)
    c.drawString(0.5*cm, y, "*Terms & conditions apply")
    y -= 45

    barcode_value = f"{vehicle_no}"
    barcode = code128.Code128(barcode_value, barHeight=40, barWidth=1.5) 
    barcode.drawOn(c, 0.1*cm, y)

    c.save()
    return invoice_path_pdf

def park_in_msg(vehicle_no,save=False):
    record,ph = get_park_in(vehicle_no)
    if not record:
        response = {"status":"error",
                    "message":"Vehicle not found"}
        return response
    message = (
        f"K&K PARKING, ARANI\n"
        f"-------------------------------------\n"
        f"                 INVOICE \n"
        f"-------------------------------------\n"
        f"Vehicle Name    : {record.vehicle_name}\n"
        f"Vehicle Number  : {record.vehicle_no}\n"
        f"Park In Time    : {record.park_in_date.strftime('%d-%m-%Y %I:%M %p')}\n"
        f"Amount          : Rs.{record.amount} for 24 hours.\n"
        f"Prepaid Amount  : Rs.{record.prepaid}/-\n"
        f"Bill Number     : {record.bill_no}\n"
        f"Phone Number    : {ph}\n"
        f"-------------------------------------\n"
        f"Whatsapp & Gpay ph: 9444718580\n"
        f"-------------------------------------\n"
        f"Please keep this receipt safe for proofs\n"
        f"when you check out.\n"
        f"-------------------------------------\n"
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
    response = {"status":"success",
                "message":"Message send successfully!"}
    return response