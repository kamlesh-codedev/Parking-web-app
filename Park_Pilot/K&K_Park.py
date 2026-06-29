import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import os
from datetime import datetime
import time
import Park_in
import Park_out
from PIL import Image, ImageTk
from tkinter import Label, Button, Canvas, Entry, Frame
from PIL import Image, ImageTk
import itertools
import Park_in
import sqlite3
import Data_save
import cv2
from pyzbar.pyzbar import decode
import Msg
from plyer import notification

def notify(msg, title="Message"):
    notification.notify(
        title=title,
        message=msg,
        timeout=2  # seconds
    )
# Function to handle Park In process
glow_label = None  # Holds the glowing text



def scan_barcode(camera_index=0, window_name="Barcode Scanner"):
    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        notify("Cannot open camera","Error")
        return None

    scanned_value = None

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                notify("Failed to read frame","Error")
                break

            for barcode in decode(frame):
                scanned_value = barcode.data.decode("utf-8")
                return scanned_value  # exit immediately

            cv2.imshow(window_name, frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()

    return None

def park_in_screen():
    for widget in root.winfo_children():
        widget.destroy()
    
    canvas = Canvas(root, width=600, height=800)
    canvas.pack(fill="both", expand=True)
    canvas.config(bg=next(color_cycle))
    
    Label(canvas, text="Park In", font=("Arial", 30, "bold"), bg=canvas.cget("bg"), fg="#FFFFFF").pack(pady=20)
    
    frame = Frame(canvas, bg=canvas.cget("bg"))
    frame.pack(pady=20)
    
    labels = ["Vehicle Name:", "Vehicle Number:", "Parking Fee:", "Pre Paid Amount:", "Phone Number:"]
    entries = []
    
    for text in labels:
        lbl = Label(frame, text=text, font=("Arial", 16, "bold"), bg=canvas.cget("bg"), fg="#FFFFFF", anchor="w")
        lbl.grid(sticky="w", padx=10, pady=5, row=labels.index(text), column=0)
        entry = Entry(frame, font=("Arial", 14))
        entry.grid(sticky="w", padx=10, pady=5, row=labels.index(text), column=1)
        entries.append(entry)
    
    def submit():
        vehicle_name = entries[0].get()
        vehicle_number = entries[1].get()
        amt = entries[2].get()
        preamt = entries[3].get()
        ph = entries[4].get()
        Park_in.lorry_park_in(vehicle_number, vehicle_name, amt, preamt, ph,root)
    
    Button(canvas, text="Submit", command=submit, font=("Arial", 20, "bold"), bg="#50FA7B", fg="#282A36", relief="ridge", borderwidth=10).pack(pady=20)
    Button(canvas, text="Back", command=main_screen, font=("Arial", 20, "bold"), bg="#44475A", fg="#F8F8F2", relief="ridge", borderwidth=5).pack(pady=10)
    
def get_parked_vehicles():
    conn = sqlite3.connect("parking.db")
    cursor = conn.cursor()
    cursor.execute("SELECT vehicle_number FROM parked_vehicles")
    vehicles = [row[0] for row in cursor.fetchall()]
    conn.close()
    return vehicles

def park_out_screen():
    for widget in root.winfo_children():
        widget.destroy()
    
    canvas = Canvas(root, width=600, height=800)
    canvas.pack(fill="both", expand=True)
    canvas.config(bg=next(color_cycle))
    
    Label(canvas, text="Park Out", font=("Arial", 30, "bold"),
          bg=canvas.cget("bg"), fg="#FFFFFF").pack(pady=20)
    
    frame = Frame(canvas, bg=canvas.cget("bg"))
    frame.pack(pady=20)
    
    Label(frame, text="Vehicle Number:", font=("Arial", 16, "bold"),
          bg=canvas.cget("bg"), fg="#FFFFFF").grid(
          sticky="w", padx=10, pady=5, row=0, column=0)
    
    def refresh_dropdown():
        parked_vehicles = get_parked_vehicles()
        vehicle_dropdown["values"] = parked_vehicles
    
    parked_vehicles = get_parked_vehicles()
    
    vehicle_dropdown = ttk.Combobox(
        frame, values=parked_vehicles, font=("Arial", 16, "bold")
    )
    vehicle_dropdown.grid(sticky="w", padx=10, pady=5, row=0, column=1)
    
    # 🔍 Barcode Scan Logic
    def scan_and_set():
        while True:
            scanned_value = scan_barcode()  # your function
        
            if not scanned_value:
                messagebox.showwarning("Scan Failed", "No barcode detected!")
                return
        
            if scanned_value in vehicle_dropdown["values"]:
                vehicle_dropdown.set(scanned_value)
                messagebox.showinfo("Success", f"Vehicle {scanned_value} selected")
            
                submit()   # 🔥 AUTO-SUBMIT HERE
                break
            else:
                retry = messagebox.askretrycancel(
                    "Invalid Vehicle",
                    f"{scanned_value} not found in parked vehicles.\nScan again?"
                )
                if not retry:
                    break
    
    def submit():
        selected_vehicle = vehicle_dropdown.get()
        if selected_vehicle:
            Park_out.lorry_park_out(selected_vehicle, root)
            refresh_dropdown()
    
    # Buttons
    Button(canvas, text="Scan Barcode", command=scan_and_set,
           font=("Arial", 16, "bold"), bg="#8BE9FD",
           fg="#282A36", relief="ridge", borderwidth=8).pack(pady=10)
    
    Button(canvas, text="Submit", command=submit,
           font=("Arial", 20, "bold"), bg="#50FA7B",
           fg="#282A36", relief="ridge", borderwidth=10).pack(pady=20)
    
    Button(canvas, text="Back", command=main_screen,
           font=("Arial", 20, "bold"), bg="#44475A",
           fg="#F8F8F2", relief="ridge", borderwidth=5).pack(pady=10)

    

def monthly_report_screen():
    for widget in root.winfo_children():
        widget.destroy()

    canvas = Canvas(root, width=600, height=800)
    canvas.pack(fill="both", expand=True)
    canvas.config(bg=next(color_cycle))

    Label(canvas, text="Monthly Report", font=("Arial", 30, "bold"), bg=canvas.cget("bg"), fg="#FFFFFF").pack(pady=20)

    # Call fetch_all from Data_save
    Data_save.show_monthly_table(canvas)

    Button(canvas, text="Refresh", command=Data_save.manual_refresh, font=("Arial", 20, "bold"), bg="#FFB703", fg="#282A36", relief="ridge", borderwidth=10).pack(pady=20)
    Button(canvas, text="Back", command=main_screen, font=("Arial", 20, "bold"), bg="#44475A", fg="#F8F8F2", relief="ridge", borderwidth=5).pack(pady=10)



# Main screen setup
def main_screen():
    Data_save.delete_previous_month_records()
    for widget in root.winfo_children():
        widget.destroy()
    
    canvas = Canvas(root, width=600, height=800)
    canvas.pack(fill="both", expand=True)
    canvas.config(bg=next(color_cycle))

    global glow_label

    # Clear previous screen
    for widget in root.winfo_children():
        widget.destroy()

    canvas = Canvas(root, width=600, height=800, bg=next(color_cycle))
    canvas.pack(fill="both", expand=True)

    # Glowing "K & K" text (only in main screen)
    glow_label = Label(canvas, text="K & K Parking ", font=("Arial", 40, "bold"), bg=canvas.cget("bg"))
    glow_label.pack(pady=10)

    glow_colors = ["#FF0000", "#FF7F00", "#FFFF00", "#7FFF00", "#00FF00", "#00FF7F", "#00FFFF", "#007FFF", "#0000FF", "#7F00FF", "#FF00FF"]

    def animate_glow():
        if glow_label and glow_label.winfo_exists():
            current_color = glow_colors.pop(0)
            glow_colors.append(current_color)
            glow_label.config(fg=current_color)
            root.after(500, animate_glow)

    animate_glow()
    
    try:
        # Glowing K & K text

        image = Image.open("1.png")
        image = image.resize((200, 100))  # 2 inch x 1 inch size
        border_width = 4
        border = Image.new("RGB", (208, 108), (255, 215, 0))  # Golden border
        border.paste(image, (border_width, border_width))
        photo = ImageTk.PhotoImage(border)

        label_image = Label(canvas, image=photo, bg=canvas.cget("bg"))
        label_image.image = photo  # Keep reference
        label_image.pack(pady=50)  # Centered Image
    except FileNotFoundError:
        label_image = Label(canvas, text="Image Not Found", fg="red", font=("Arial", 12), bg=canvas.cget("bg"))
        label_image.pack(pady=50)

    # Buttons with modern colors and rounded borders
    btn1 = Button(canvas, text="Park In", command=park_in_screen, font=("Arial", 20, "bold"), bg="#6272A4", fg="#F8F8F2", relief="ridge", borderwidth=10)
    btn1.pack(pady=20)

    btn2 = Button(canvas, text="Park Out", command=park_out_screen, font=("Arial", 20, "bold"), bg="#50FA7B", fg="#282A36", relief="ridge", borderwidth=10)
    btn2.pack(pady=20)

    btn3 = Button(canvas, text="Monthly Report", command=lambda: monthly_report_screen(), font=("Arial", 20, "bold"), bg="#FF5555", fg="#F8F8F2", relief="ridge", borderwidth=10)
    btn3.pack(pady=20)

    # Small corner button (Send Saved Msg)
    btn_send_saved = Button(
        canvas,
        text="Send Saved Msg",
        command=lambda: Msg.send_saved(root),
        font=("Arial", 10, "bold"),
        bg="#44475A",
        fg="#F8F8F2"
    )

# Position at bottom-right corner
    btn_send_saved.place(relx=0.98, rely=0.98, anchor="se")


# List of colors for background rotation
colors = ["#1E1E2E", "#2B2D42", "#3D405B", "#FFB703", "#8D99AE"]
color_cycle = itertools.cycle(colors)

# Main application window
root = tk.Tk()
root.title("K & K Parking Management")
root.geometry("600x800")

main_screen()
root.mainloop()
