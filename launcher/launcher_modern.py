import subprocess
import threading
import time
import requests
import webbrowser
import re
import pyperclip
import os
import sys
from pathlib import Path
from datetime import datetime
import tkinter.messagebox as messagebox

import customtkinter as ctk

# --- Configuration & Paths ---
if getattr(sys, 'frozen', False):
    # If running as a compiled .exe
    PROJECT_ROOT = Path(sys.executable).resolve().parent.parent
else:
    # If running as a standard Python script
    PROJECT_ROOT = Path(__file__).resolve().parent.parent

BACKEND_DIR = PROJECT_ROOT / "parking_backend"

# --- Globals ---
flask_process = None
cloudflare_process = None
tunnel_url = None

# For hiding Windows console popups
CREATE_NO_WINDOW = 0x08000000 if os.name == 'nt' else 0

# --- Backend Logic (Preserved & Adjusted for silent execution) ---

def check_internet():
    try:
        requests.get("https://1.1.1.1", timeout=3)
        return True
    except:
        return False

def start_flask():
    global flask_process
    flask_process = subprocess.Popen(
        ["python", "app.py"],
        cwd=BACKEND_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=CREATE_NO_WINDOW
    )

def wait_for_flask():
    start_time = time.time()
    while True:
        try:
            r = requests.get("http://127.0.0.1:5000", timeout=2)
            if r.status_code == 200:
                break
        except:
            pass
        
        if time.time() - start_time > 30: # 30 seconds timeout
            raise Exception("Flask server timeout.")
            
        time.sleep(1)

def start_cloudflare():
    global cloudflare_process
    cloudflare_process = subprocess.Popen(
        [
            "cloudflared",
            "tunnel",
            "--url",
            "http://localhost:5000"
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        universal_newlines=True,
        creationflags=CREATE_NO_WINDOW
    )

    url = None
    regex = r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com"

    while True:
        line = cloudflare_process.stdout.readline()
        if not line:
            break # Process terminated or EOF
        
        match = re.search(regex, line)
        if match:
            url = match.group(0)
            break

    return url

def save_url(url):
    desktop = Path.home() / "Desktop"
    file = desktop / "Parking Remote.txt"
    with open(file, "w") as f:
        f.write("KK PARKING SYSTEM\n\n")
        f.write("Remote URL\n\n")
        f.write(url)
    pyperclip.copy(url)

def open_browser():
    webbrowser.open("http://127.0.0.1:5000")

def stop_everything():
    global cloudflare_process, flask_process
    if cloudflare_process:
        try:
            cloudflare_process.terminate()
        except:
            pass
    if flask_process:
        try:
            flask_process.terminate()
        except:
            pass


# --- Modern CustomTkinter UI ---

class LauncherApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Window Setup
        self.title("KK Parking System")
        self.geometry("800x650")
        self.resizable(False, False)
        
        # CustomTkinter Configuration
        ctk.set_appearance_mode("Light")
        self.configure(fg_color="#f8f9fa")
        
        # Placeholder Icon
        try:
            self.iconbitmap("icon.ico")
        except:
            pass 
            
        self.protocol("WM_DELETE_WINDOW", self.stop_system)

        # Loading UI
        self.loading_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.loading_frame.place(relx=0.5, rely=0.5, anchor="center")

        self.load_title = ctk.CTkLabel(
            self.loading_frame, 
            text="KK PARKING SYSTEM", 
            font=("Segoe UI", 32, "bold"),
            text_color="#212529"
        )
        self.load_title.pack(pady=(0, 15))

        self.load_subtitle = ctk.CTkLabel(
            self.loading_frame, 
            text="Starting Local Server...", 
            font=("Segoe UI", 18),
            text_color="#495057"
        )
        self.load_subtitle.pack(pady=5)

        self.load_indicator = ctk.CTkLabel(
            self.loading_frame, 
            text="Loading...", 
            font=("Segoe UI", 14), 
            text_color="#adb5bd"
        )
        self.load_indicator.pack(pady=10)

        # Start the immediate local startup sequence
        threading.Thread(target=self.startup_sequence, daemon=True).start()

    def update_loading_text(self, text):
        self.load_subtitle.configure(text=text)

    def show_error_and_exit(self, title, message):
        messagebox.showerror(title, message)
        self.destroy()
        sys.exit(1)
        
    def show_tunnel_warning(self, title, message):
        messagebox.showwarning(title, message)
        self.cf_text.configure(text="Failed to Connect")
        self.cf_dot.configure(text_color="#d9534f") # Red
        self.url_var.set("Tunnel configuration failed.")

    def startup_sequence(self):
        # 1. Start Flask IMMEDIATELY for local use
        try:
            start_flask()
            wait_for_flask()
        except Exception as e:
            self.after(0, self.show_error_and_exit, "Error", "Unable to start local Flask Server.")
            return

        # 2. Open Local Browser immediately so user can work
        self.after(0, self.update_loading_text, "Opening Browser...")
        open_browser()

        # 3. Switch to Main UI (URL will show "Waiting for Network..." initially)
        self.after(0, self.build_main_ui)
        
        # 4. Start the background tunnel process
        threading.Thread(target=self.tunnel_sequence, daemon=True).start()

    def tunnel_sequence(self):
        # Loop silently until internet is available
        while not check_internet():
            time.sleep(3)
            
        # Once internet connects, start Cloudflare
        try:
            global tunnel_url
            tunnel_url = start_cloudflare()
            if tunnel_url:
                save_url(tunnel_url)
                # Safely update the main UI with the new URL and green status
                self.after(0, self.update_tunnel_ui, tunnel_url)
            else:
                self.after(0, self.show_tunnel_warning, "Tunnel Error", "Unable to establish Cloudflare Tunnel.")
        except Exception as e:
            self.after(0, self.show_tunnel_warning, "Tunnel Error", "Unable to establish Cloudflare Tunnel.")

    def update_tunnel_ui(self, url):
        self.url_var.set(url)
        self.cf_dot.configure(text_color="#28a745") # Change to Green
        self.cf_text.configure(text="Connected")
        self.copy_btn.configure(state="normal") # Enable the copy button

    def build_main_ui(self):
        # Clear loading screen
        self.loading_frame.destroy()

        # Top Header
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.pack(side="top", fill="x", pady=(35, 0))

        ctk.CTkLabel(
            header_frame, 
            text="KK PARKING SYSTEM", 
            font=("Segoe UI", 28, "bold"), 
            text_color="#111111"
        ).pack()
        
        ctk.CTkLabel(
            header_frame, 
            text="Parking Management Launcher", 
            font=("Segoe UI", 16), 
            text_color="#6c757d"
        ).pack()

        # Center Card (System Status)
        card = ctk.CTkFrame(
            self, 
            fg_color="#ffffff", 
            corner_radius=15, 
            border_width=1, 
            border_color="#dee2e6"
        )
        card.pack(side="top", fill="both", expand=True, padx=70, pady=(20, 15))

        ctk.CTkLabel(
            card, 
            text="System Status", 
            font=("Segoe UI", 18, "bold"), 
            text_color="#212529"
        ).pack(pady=(15, 10))

        status_grid = ctk.CTkFrame(card, fg_color="transparent")
        status_grid.pack(pady=5)

        # Status Indicators Helper
        font_indicator = ("Segoe UI", 16, "bold")
        font_text = ("Segoe UI", 16)
        color_green = "#28a745"
        color_black = "#343a40"
        color_waiting = "#fd7e14" # Orange for waiting state

        # 1. Server
        ctk.CTkLabel(status_grid, text="● Server", font=font_indicator, text_color=color_green, width=150, anchor="w").grid(row=0, column=0, padx=(0, 30), pady=8)
        ctk.CTkLabel(status_grid, text="Running", font=font_text, text_color=color_black, anchor="w").grid(row=0, column=1, pady=8)

        # 2. Cloudflare (Dynamic Status)
        self.cf_dot = ctk.CTkLabel(status_grid, text="● Cloudflare", font=font_indicator, text_color=color_waiting, width=150, anchor="w")
        self.cf_dot.grid(row=1, column=0, padx=(0, 30), pady=8)
        self.cf_text = ctk.CTkLabel(status_grid, text="Waiting for Network...", font=font_text, text_color=color_black, anchor="w")
        self.cf_text.grid(row=1, column=1, pady=8)

        # 3. Database
        ctk.CTkLabel(status_grid, text="● Database", font=font_indicator, text_color=color_green, width=150, anchor="w").grid(row=2, column=0, padx=(0, 30), pady=8)
        ctk.CTkLabel(status_grid, text="Ready", font=font_text, text_color=color_black, anchor="w").grid(row=2, column=1, pady=8)

        # 4. Printer
        ctk.CTkLabel(status_grid, text="● Printer", font=font_indicator, text_color=color_green, width=150, anchor="w").grid(row=3, column=0, padx=(0, 30), pady=8)
        ctk.CTkLabel(status_grid, text="Ready", font=font_text, text_color=color_black, anchor="w").grid(row=3, column=1, pady=8)

        # Remote URL Section
        url_frame = ctk.CTkFrame(self, fg_color="transparent")
        url_frame.pack(side="top", fill="x", padx=70, pady=(0, 15))

        ctk.CTkLabel(
            url_frame, 
            text="Remote Access URL", 
            font=("Segoe UI", 15, "bold"), 
            text_color="#212529"
        ).pack(anchor="w", padx=5)

        # URL Box (Defaults to a waiting message until internet connects)
        self.url_var = ctk.StringVar(value="Waiting for connection to generate URL...")
        url_entry = ctk.CTkEntry(
            url_frame, 
            textvariable=self.url_var, 
            font=("Consolas", 14), 
            state="readonly", 
            height=45, 
            corner_radius=8,
            fg_color="#f8f9fa",
            text_color="#495057",
            border_color="#ced4da"
        )
        url_entry.pack(fill="x", padx=5, pady=(5, 10))

        # Copy Button (Disabled initially until URL is generated)
        self.copy_btn = ctk.CTkButton(
            url_frame, 
            text="Copy URL", 
            font=("Segoe UI", 14, "bold"), 
            height=40,
            width=140,
            corner_radius=8, 
            state="disabled",
            command=self.copy_url
        )
        self.copy_btn.pack(pady=(0, 5))

        # Stop System Button
        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.pack(side="top", fill="x", padx=70, pady=(5, 15))

        stop_btn = ctk.CTkButton(
            btn_frame, 
            text="Stop System", 
            font=("Segoe UI", 15, "bold"), 
            height=50, 
            corner_radius=10,
            fg_color="#d9534f", 
            hover_color="#c9302c", 
            command=self.stop_system
        )
        stop_btn.pack(fill="x", padx=5)

        # Bottom Info
        bottom_frame = ctk.CTkFrame(self, fg_color="transparent")
        bottom_frame.pack(side="bottom", fill="x", padx=30, pady=(0, 15))

        now = datetime.now()
        time_str = now.strftime("%I:%M %p")
        date_str = now.strftime("%B %d, %Y")

        info_text = f"Started Time: {time_str}   |   Current Date: {date_str}   |   Version 1.0.0"
        ctk.CTkLabel(
            bottom_frame, 
            text=info_text, 
            font=("Segoe UI", 12), 
            text_color="#868e96"
        ).pack()

    def copy_url(self):
        if tunnel_url:
            pyperclip.copy(tunnel_url)
            self.copy_btn.configure(text="✓ Copied")
            self.after(2000, lambda: self.copy_btn.configure(text="Copy URL"))

    def stop_system(self):
        if not messagebox.askyesno("Stop System", "Are you sure you want to stop the Parking System?"):
            return

        self.destroy()


if __name__ == "__main__":
    app = None
    try:
        app = LauncherApp()
        app.mainloop()
    finally:
        stop_everything()