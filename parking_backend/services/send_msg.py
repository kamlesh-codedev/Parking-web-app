import pyautogui
import time
import json
import os
import pyperclip

SAVE_FILE = "failed_messages.json"


def save_message(message,ph):
    data = []
    if os.path.exists(SAVE_FILE):
        with open(SAVE_FILE, "r") as f:
            data = json.load(f)

    data.append({"phone": ph, "message": message})

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

def load_and_clear(phone_no=None, load=False):
    if not os.path.exists(SAVE_FILE):
        return []

    with open(SAVE_FILE, "r") as f:
        data = json.load(f)

    # Load all data without clearing
    if load:
        return data

    # Load only one phone's messages and remove them from the file
    if phone_no is not None:
        matched = [item for item in data if item["phone"] == phone_no]
        remaining = [item for item in data if item["phone"] != phone_no]

        with open(SAVE_FILE, "w") as f:
            json.dump(remaining, f, indent=4)

        return send_saved(matched)

    # Default: return everything and clear the file
    with open(SAVE_FILE, "w") as f:
        json.dump([], f)

    return data


# ---------------------------
# SEND SAVED USING send()
# ---------------------------
def send_saved(data):

    if not data:
        return False

    for item in data:
        if not send(item["phone"], item["message"]):
            return False
    return True