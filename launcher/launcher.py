import subprocess
import threading
import time
import requests
import webbrowser
import re
import pyperclip
import os
from pathlib import Path
import tkinter as tk
from tkinter import messagebox

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "parking_backend"

flask_process = None
cloudflare_process = None


def start_flask():
    global flask_process

    print("[1/5] Starting Flask...")

    flask_process = subprocess.Popen(
        ["python", "app.py"],
        cwd=BACKEND_DIR
    )


def wait_for_flask():

    print("[2/5] Waiting for Flask...")

    while True:
        try:
            r = requests.get("http://127.0.0.1:5000")

            if r.status_code == 200:
                break

        except:
            pass

        time.sleep(1)

    print("Flask Ready")


def start_cloudflare():

    global cloudflare_process

    print("[3/5] Starting Cloudflare Tunnel...")

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
        universal_newlines=True
    )

    url = None

    regex = r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com"

    while True:

        line = cloudflare_process.stdout.readline()

        if not line:
            continue

        print(line.strip())

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

    print("[4/5] URL saved")

    print(file)


def open_browser():

    print("[5/5] Opening Browser...")

    webbrowser.open("http://127.0.0.1:5000")


def stop_everything():

    print("\nStopping...")

    if cloudflare_process:
        cloudflare_process.terminate()

    if flask_process:
        flask_process.terminate()

    print("Stopped.")

def show_launcher(url):

    root = tk.Tk()
    root.title("KK Parking System")
    root.geometry("650x420")
    root.resizable(False, False)

    def copy_url():
        pyperclip.copy(url)
        copy_btn.config(text="✓ Copied")

        root.after(
            2000,
            lambda: copy_btn.config(text="Copy URL")
        )

    def stop_system():

        if not messagebox.askyesno(
            "Stop System",
            "Are you sure you want to stop the Parking System?"
        ):
            return

        stop_everything()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", stop_system)

    tk.Label(
        root,
        text="KK PARKING SYSTEM",
        font=("Segoe UI", 20, "bold")
    ).pack(pady=15)

    frame = tk.Frame(root)
    frame.pack()

    status_font = ("Segoe UI", 11)

    STATUS_OK = "●"
    STATUS_WAIT = "◐"
    STATUS_ERROR = "✖"
    
    tk.Label(frame, text="🟢 Server", width=18, anchor="w", font=status_font).grid(row=0, column=0, padx=15, pady=5)
    tk.Label(frame, text="Running", anchor="w", font=status_font).grid(row=0, column=1)

    tk.Label(frame, text="🟢 Cloudflare", width=18, anchor="w", font=status_font).grid(row=1, column=0, padx=15, pady=5)
    tk.Label(frame, text="Connected", anchor="w", font=status_font).grid(row=1, column=1)

    tk.Label(frame, text="🟢 Database", width=18, anchor="w", font=status_font).grid(row=2, column=0, padx=15, pady=5)
    tk.Label(frame, text="Ready", anchor="w", font=status_font).grid(row=2, column=1)

    tk.Label(frame, text="🟢 Printer", width=18, anchor="w", font=status_font).grid(row=3, column=0, padx=15, pady=5)
    tk.Label(frame, text="Ready", anchor="w", font=status_font).grid(row=3, column=1)

    tk.Label(
        root,
        text="\nRemote Access URL",
        font=("Segoe UI", 12, "bold")
    ).pack()

    url_box = tk.Entry(
        root,
        width=75,
        justify="center",
        font=("Consolas", 10)
    )

    url_box.pack(pady=10)
    url_box.insert(0, url)
    url_box.config(state="readonly")

    button_frame = tk.Frame(root)
    button_frame.pack(pady=25)

    copy_btn = tk.Button(
        button_frame,
        text="Copy URL",
        width=18,
        command=copy_url
    )

    copy_btn.grid(row=0, column=0, padx=10)

    tk.Button(
        button_frame,
        text="Stop System",
        width=18,
        bg="#d9534f",
        fg="white",
        command=stop_system
    ).grid(row=0, column=1, padx=10)

    root.mainloop()

if __name__ == "__main__":

    try:

        start_flask()

        wait_for_flask()

        tunnel_url = start_cloudflare()

        print("\nTunnel URL:")

        print(tunnel_url)

        save_url(tunnel_url)

        open_browser()

        show_launcher(tunnel_url)

    finally:

        stop_everything()