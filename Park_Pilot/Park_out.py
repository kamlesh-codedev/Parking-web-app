import os
import time
from datetime import datetime
from tkinter import messagebox, simpledialog
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch,cm
import Print
import sqlite3
import Data_save
import Msg
from plyer import notification

def notify(msg, title="Message"):
    notification.notify(
        title=title,
        message=msg,
        timeout=2  # seconds
    )

def lorry_park_out(vehicle_number,root):
    park_out_time = time.time()  # Current time
    
    details_path = os.path.join("parking_records", f"Details_{vehicle_number}.txt")
    invoice_path_pdf = os.path.join("parking_records", f"Invoice_{vehicle_number}.pdf")
    
    try:
        with open(details_path, 'r') as in_file:
            lines = in_file.readlines()

            
        out_invoice_path_pdf = os.path.join("parking_records", f"Out_invoice_{vehicle_number}.pdf")  
        PAGE_WIDTH = 4 * inch
        PAGE_HEIGHT = 6* inch

        c = canvas.Canvas(out_invoice_path_pdf, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

        vehicle_found = False
        for line in lines:
            stored_vehicle_number, park_in_time, stored_vehicle_name, stored_amt, stored_preamt, stored_bill_number,ph = line.split()
            park_in_time = float(park_in_time)
            stored_amt = int(stored_amt)
            stored_preamt = int(stored_preamt)

            if stored_vehicle_number == vehicle_number:
                vehicle_found = True
                duration = int((park_out_time - park_in_time) / (60 * 60 * 24))+1
                parking_fee = duration * stored_amt
                amt_due1 = parking_fee - stored_preamt

                # Display the amount to be paid
                messagebox.showinfo("Amount to be paid", f"Amount to be paid: Rs.{amt_due1}/-")  # Adjust padding as needed

            # Optionally, you can add a button to close the window if required


            # Prompt user to enter amount paid
                amt_paid = simpledialog.askinteger("Payment", "Enter the amount paid for parking:")
            

                amt_due = parking_fee - (stored_preamt+amt_paid)

                # Remaining code continues here...
                conn = sqlite3.connect("parking.db")
                cursor = conn.cursor()
                cursor.execute("DELETE FROM parked_vehicles WHERE vehicle_number = ?", (stored_vehicle_number,))
                conn.commit()
                conn.close()

                Data_save.update_park_out(stored_vehicle_number,duration,parking_fee,datetime.fromtimestamp(park_out_time).strftime('%Y-%m-%d %H:%M:%S'))


                # Write details to TXT file
                message = (
                    "K&K PARKING, ARANI\n"
                    "-------------------------------------\n"
                    "                   INVOICE\n"
                    "-------------------------------------\n"
                    f"Vehicle Name    : {stored_vehicle_name}\n"
                    f"Vehicle Number  : {stored_vehicle_number}\n"
                    f"Park In Time    : {datetime.fromtimestamp(park_in_time).strftime('%Y-%m-%d %H:%M:%S')}\n"
                    f"Park Out Time   : {datetime.fromtimestamp(park_out_time).strftime('%Y-%m-%d %H:%M:%S')}\n"
                    f"Total Duration  : {duration} day(s)\n"
                    f"Parking Fee     : Rs.{parking_fee}/-\n"
                    f"Amount Paid     : Rs.{amt_paid}/-\n"
                    f"Prepaid Amount  : Rs.{stored_preamt}/-\n"
                    f"Amount Due      : Rs.{amt_due}/-\n"
                    f"Bill Number     : {stored_bill_number}\n"
                    "-------------------------------------\n"
                    "Whatsapp & Gpay ph: 9444718580\n"
                    "-------------------------------------\n"
                    "Thank you! visit again.\n"
                    "-------------------------------------\n"
                )

                
                # Write content to PDF


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
                c.drawString(0.5*cm, y, f"Vehicle No   : {stored_vehicle_number}")
                y -= 15
                c.setFont("Times-Roman", 15)
                c.drawString(0.5*cm, y, f"Time OUT     : {datetime.fromtimestamp(park_out_time).strftime('%Y-%m-%d %H:%M:%S')}")
                y -= 18
                c.drawString(0.5*cm, y, f"Duration        : {duration} day(s)")
                y -= 18
                c.setFont("Times-Bold", 15)
                c.drawString(0.5*cm, y, f"Parking Fee  : Rs.{parking_fee - stored_preamt}/-")
                y -= 18
                c.setFont("Times-Roman", 15)
                c.drawString(0.5*cm, y, f"Amount Due  : Rs.{amt_due}/-")
                y -= 18
                c.drawString(0.5*cm, y, "-"*50)



                c.save()
                Print.auto_print_pdf(out_invoice_path_pdf)
    
            

                os.remove(details_path)
                if os.path.exists(invoice_path_pdf):
                    os.remove(invoice_path_pdf)
                Msg.send(ph,message,root)
                
                notify(f"Vehicle '{vehicle_number}' parked out successfully!","Park Out")

                break

        if not vehicle_found:
            notify(f"Vehicle number {vehicle_number} not found in records.","Error")
            
        # Delete the park-in text file after generating park-out files        
    except FileNotFoundError:
        notify(f"No record found for vehicle number {vehicle_number}.","Error")
