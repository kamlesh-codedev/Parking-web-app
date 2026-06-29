import sqlite3
from datetime import datetime
import tkinter as tk
from tkinter import ttk
from tkinter import Frame, Label, Entry, StringVar

DB_NAME = 'Record.db'

def create_table():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Record (
            s_no INTEGER PRIMARY KEY AUTOINCREMENT,
            park_in_date TEXT,
            bill_no TEXT,
            vehicle_no TEXT,
            vehicle_name TEXT,
            no_of_days INTEGER,
            park_out TEXT,
            amount REAL
        )
    ''')
    conn.commit()
    conn.close()

def insert_park_in(bill_no, vehicle_no, vehicle_name,time):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO Record (park_in_date, bill_no, vehicle_no, vehicle_name)
        VALUES (?, ?, ?, ?)
    ''', (time, bill_no, vehicle_no, vehicle_name))
    conn.commit()
    conn.close()

def update_park_out(vehicle_no, no_of_days, amount,time):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE Record
        SET no_of_days = ?, park_out = ?, amount = ?
        WHERE vehicle_no = ? AND park_out IS NULL
    ''', (no_of_days, time, amount, vehicle_no))
    conn.commit()
    conn.close()

def delete_previous_month_records():
    now = datetime.now()
    current_month = now.month
    current_year = now.year

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM Record
        WHERE 
            park_out IS NOT NULL AND 
            (
                strftime('%m', park_in_date) != ? OR 
                strftime('%Y', park_in_date) != ?
            )
    ''', (f"{current_month:02d}", str(current_year)))
    conn.commit()
    conn.close()

def manual_refresh():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM Record')
    cursor.execute('DELETE FROM sqlite_sequence WHERE name="Record"')
    conn.commit()
    conn.close()


def fetch_all():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM Record')
    data = cursor.fetchall()
    conn.close()
    return data

def show_monthly_table(canvas):
    frame = Frame(canvas, bg=canvas.cget("bg"))
    frame.pack(pady=10, fill="both", expand=True)

    search_frame = Frame(frame, bg=canvas.cget("bg"))
    search_frame.pack(pady=5)
    Label(search_frame, text="🔍 Search:", font=("Arial", 12, "bold"), bg=canvas.cget("bg"), fg="#F8F8F2").pack(side="left")
    search_var = StringVar()
    search_entry = Entry(search_frame, textvariable=search_var, font=("Arial", 12), width=30, bd=2, relief="groove")
    search_entry.pack(side="left", padx=10)

    columns = ("S.No", "Park In Date", "Bill No", "Vehicle No", 
               "Vehicle Name", "No. of Days", "Park Out", "Amount")

    style = ttk.Style()
    style.theme_use("default")
    style.configure("Treeview.Heading",
                    font=("Arial", 12, "bold"),
                    background="#000000",
                    foreground="#FFFFFF")
    style.configure("Treeview",
                    font=("Arial", 10),
                    rowheight=30)
    style.map('Treeview', background=[('selected', '#A3CEF1')])
    style.layout("Treeview", [('Treeview.treearea', {'sticky': 'nswe'})])
    tree = ttk.Treeview(frame, columns=columns, show="headings", height=15)
    style.configure("Treeview", 
                font=("Arial", 10), 
                rowheight=30,
                foreground="#212121",
                background="#FFFFFF",  
                fieldbackground="#FFFFFF")
    for col in columns:
        tree.heading(col, text=col)
        tree.column(col, anchor="center", width=110)
    vsb = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
    hsb = ttk.Scrollbar(frame, orient="horizontal", command=tree.xview)
    tree.configure(yscroll=vsb.set, xscroll=hsb.set)
    vsb.pack(side="right", fill="y")
    hsb.pack(side="bottom", fill="x")
    tree.pack(side="left", fill="both", expand=True)

    def populate_table(filtered_data=None):
        tree.delete(*tree.get_children())
        data = filtered_data if filtered_data else fetch_all()
        for index, row in enumerate(data):
            tag = 'evenrow' if index % 2 == 0 else 'oddrow'
            tree.insert("", "end", values=row, tags=(tag,))
            tree.tag_configure('evenrow', background='#DCEFFE') 
            tree.tag_configure('oddrow', background='#F9F9F9')

    def filter_table(*args):
        keyword = search_var.get().lower()
        full_data = fetch_all()
        filtered = [
            row for row in full_data
            if keyword in str(row[3]).lower() or keyword in str(row[4]).lower()
        ]
        populate_table(filtered)
    search_var.trace("w", filter_table)

    populate_table()
    return tree, populate_table

create_table()
