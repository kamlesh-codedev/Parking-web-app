import subprocess
import threading
import time
import requests
import webbrowser
import re
import pyperclip
import os
from pathlib import Path

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


if __name__ == "__main__":

    try:

        start_flask()

        wait_for_flask()

        tunnel_url = start_cloudflare()

        print("\nTunnel URL:")

        print(tunnel_url)

        save_url(tunnel_url)

        open_browser()

        print("\n===================================")
        print("KK PARKING SYSTEM READY")
        print("===================================")
        print(tunnel_url)
        print("Copied to Clipboard")
        print("Saved to Desktop")
        print("===================================\n")

        input("Press ENTER to Exit...")

    finally:

        stop_everything()