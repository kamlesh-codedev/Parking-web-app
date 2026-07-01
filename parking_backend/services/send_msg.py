import pyautogui
import time
import json
import os
import pyperclip

SAVE_FILE = "failed_messages.json"


def save_message(vehicle_no, park_out_status):
    data = []

    if os.path.exists(SAVE_FILE):
        with open(SAVE_FILE, "r") as f:
            data = json.load(f)

    # Prevent duplicate entries
    exists = any(
        item["vehicle_no"] == vehicle_no and
        item["park_out_status"] == park_out_status
        for item in data
    )

    if not exists:
        data.append({
            "vehicle_no": vehicle_no,
            "park_out_status": park_out_status
        })

    with open(SAVE_FILE, "w") as f:
        json.dump(data, f, indent=4)

    return True


def send(ph, message):
    time.sleep(5)

    pyautogui.hotkey('alt', 'tab')
    time.sleep(5)

    pyautogui.hotkey('ctrl', 'k')
    time.sleep(5)

    pyperclip.copy(str(ph))
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(5)

    pyautogui.press('enter')
    time.sleep(3)

    pyperclip.copy(message)
    pyautogui.hotkey('ctrl', 'v')
    time.sleep(5)

    pyautogui.press('enter')
    return True

# ---------------------------
# LOAD + CLEAR
# ---------------------------

def load_messages():
    if not os.path.exists(SAVE_FILE):
        return []

    with open(SAVE_FILE, "r") as f:
        return json.load(f)


# ---------------------------
# SEND SAVED USING send()
# ---------------------------
def delete_message(vehicle_no, park_out_status):
    if not os.path.exists(SAVE_FILE):
        return False

    with open(SAVE_FILE, "r") as f:
        data = json.load(f)

    new_data = [
        item for item in data
        if not (
            item["vehicle_no"] == vehicle_no and
            item["park_out_status"] == park_out_status
        )
    ]

    if len(new_data) == len(data):
        return False

    with open(SAVE_FILE, "w") as f:
        json.dump(new_data, f, indent=4)

    return True