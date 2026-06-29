"""import pyautogui
import time
import subprocess
from tkinter import messagebox

def send(ph,message,root):
    confirmation = messagebox.askyesno("Confirmation", f"Send Message?")
    if confirmation:
        pyautogui.press('win')
        time.sleep(5)
        pyautogui.write('Messages')
        time.sleep(5)
        pyautogui.press('enter')
        time.sleep(15)
        pyautogui.hotkey('ctrl', 'k')
        time.sleep(5)
        pyautogui.write(ph)
        time.sleep(8)
        pyautogui.press('enter')
        time.sleep(10)

        lines = message.splitlines()
        for line in lines:
            pyautogui.write(line)
            pyautogui.keyDown('shift')
            pyautogui.press('enter')
            pyautogui.keyUp('shift')
            time.sleep(1)
        time.sleep(2)
        pyautogui.press('enter')"""
import pyautogui
import time
import json
import os
from tkinter import messagebox, Tk
from plyer import notification

SAVE_FILE = "failed_messages.json"


# ---------------------------
# SAVE
# ---------------------------
def notify(msg, title="Message"):
    notification.notify(
        title=title,
        message=msg,
        timeout=2  # seconds
    )

def save_message(ph, message):
    data = []
    if os.path.exists(SAVE_FILE):
        with open(SAVE_FILE, "r") as f:
            data = json.load(f)

    data.append({"phone": ph, "message": message})

    with open(SAVE_FILE, "w") as f:
        json.dump(data, f, indent=4)
    notify("Message saved")


# ---------------------------
# MAIN SEND FUNCTION (COMMON)
# ---------------------------

def send(ph, message, root):
    # Only ask confirmation if NOT from saved

    # Open Messages
    time.sleep(3)
    pyautogui.press('win')
    time.sleep(2)
    pyautogui.write('Messages')
    time.sleep(2)
    pyautogui.press('enter')

    if not messagebox.askyesno("Ready?", f"Send to {ph}?"):
        return

    # Search contact
    time.sleep(8)
    pyautogui.hotkey('ctrl', 'k')
    time.sleep(2)
    pyautogui.write(ph)
    time.sleep(8)
    pyautogui.press('enter')
    time.sleep(5)

    # Confirm before sending

    # Type message
    for line in message.splitlines():
        pyautogui.write(line)
        pyautogui.keyDown('shift')
        pyautogui.press('enter')
        pyautogui.keyUp('shift')
        time.sleep(1)

    time.sleep(2)
    pyautogui.press('enter')

    # Ask to save only in normal mode
    if messagebox.askyesno("Save?", "Save this message?"):
        save_message(ph, message)
    else:
        notify("Message sent")


# ---------------------------
# LOAD + CLEAR
# ---------------------------

def load_and_clear():
    if not os.path.exists(SAVE_FILE):
        return []

    with open(SAVE_FILE, "r") as f:
        data = json.load(f)

    # Clear file
    with open(SAVE_FILE, "w") as f:
        json.dump([], f)

    return data


# ---------------------------
# SEND SAVED USING send()
# ---------------------------

def send_saved(root):
    data = load_and_clear()

    if not data:
        notify("No msg saved")
        return

    for item in data:
        send(item["phone"], item["message"], root)



# ---------------------------
# RUN DIRECTLY
# ---------------------------






