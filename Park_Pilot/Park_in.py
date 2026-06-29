import os
import Bill_count
import Print
import time
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import inch
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import fonts
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
from tkinter import messagebox
import sqlite3
import Data_save
import Msg
from reportlab.graphics.barcode import code128


class ParkingDetails:
    def __init__(self, vehicle_name, vehicle_number, amt, preamt, bill_number,ph):
        self.vehicle_name = vehicle_name
        self.vehicle_number = vehicle_number
        self.park_in_time = time.time()  # Current time
        self.amt = amt
        self.preamt = preamt
        self.bill_number = bill_number
        self.ph = ph

def lorry_park_in(vehicle_number, vehicle_name, amt, preamt, ph,root):
    bill_number = Bill_count.get_next_bill_number()
    details = ParkingDetails(vehicle_name, vehicle_number, amt, preamt, bill_number,ph)
    
    details_path = os.path.join("parking_records", f"Details_{vehicle_number}.txt")
    with open(details_path, 'a') as out_file:
        out_file.write(f"{details.vehicle_number} {details.park_in_time} {details.vehicle_name} {details.amt} {details.preamt} {details.bill_number} {details.ph}\n")

    conn = sqlite3.connect("parking.db")
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS parked_vehicles (
                        vehicle_number TEXT PRIMARY KEY)''')
    cursor.execute("INSERT INTO parked_vehicles (vehicle_number) VALUES (?)", (details.vehicle_number,))
    conn.commit()
    conn.close()
    Data_save.insert_park_in(details.bill_number,details.vehicle_number,details.vehicle_name,datetime.fromtimestamp(details.park_in_time).strftime('%Y-%m-%d %H:%M:%S'))

    invoice_path_pdf = os.path.join("parking_records", f"Invoice_{vehicle_number}.pdf")
    


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
    c.drawString(0.5*cm, y, f"Vehice Name : {details.vehicle_name}")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, f"Vehicle No    : {details.vehicle_number}")
    y -= 18
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, f"Time IN          : {datetime.fromtimestamp(details.park_in_time).strftime('%d-%m-%Y %I:%M %p')}")
    y -= 18
    c.setFont("Times-Bold", 15)
    c.drawString(0.5*cm, y, f"Parking Fee  : Rs.{details.amt} for 24 hrs")
    y -= 18
    c.setFont("Times-Roman", 15)
    c.drawString(0.5*cm, y, f"Pre Paid          : Rs.{details.preamt}/-")
    y -= 18
    c.drawString(0.5*cm, y, f"Bill No           : {details.bill_number}")
    y -= 18
    c.drawString(0.5*cm, y, f"Phone No       : {ph}")
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



    barcode_value = f"{details.vehicle_number}"
    barcode = code128.Code128(barcode_value, barHeight=40, barWidth=1.5) 
# adjust barHeight/barWidth as needed
    barcode.drawOn(c, 0.1*cm, y)

    c.save()




    
    message =(
        f"K&K PARKING, ARANI\n"
        f"-------------------------------------\n"
        f"                 INVOICE \n"
        f"-------------------------------------\n"
        f"Vehicle Name    : {details.vehicle_name}\n"
        f"Vehicle Number  : {details.vehicle_number}\n"
        f"Park In Time    : {datetime.fromtimestamp(details.park_in_time).strftime('%d-%m-%Y %I:%M %p')}\n"
        f"Amount          : Rs.{details.amt} for 24 hours.\n"
        f"Prepaid Amount  : Rs.{details.preamt}/-\n"
        f"Bill Number     : {details.bill_number}\n"
        f"Phone Number    : {ph}\n"
        f"-------------------------------------\n"
        f"Whatsapp & Gpay ph: 9444718580\n"
        f"-------------------------------------\n"
        f"Please keep this receipt safe for proofs\n"
        f"when you check out.\n"
        f"-------------------------------------\n"
    )

    Print.auto_print_pdf(invoice_path_pdf)
    Msg.send(ph,message,root)
    
