import subprocess
import os
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

SUMATRA_PATH = r"C:\Users\KK\AppData\Local\SumatraPDF\SumatraPDF.exe"

def auto_print_pdf(file_path, printer_name=None):
    # ✅ Check if file exists
    if not os.path.exists(file_path):
        notify(f"File not found:{file_path}","Error")
        return None

    command = [SUMATRA_PATH]

    if printer_name:
        command += ["-print-to", printer_name]
    else:
        command += ["-print-to-default"]

    # ✅ Add print settings (important for your 4x6 issue)
    command += ["-print-settings", "noscale"]

    command.append(file_path)

    try:
        subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )
        notify("Printing Successful","Success")
        return None
    except subprocess.CalledProcessError:
        notify("Printing failed","Error")
        return None


# Example
#print_pdf(r"C:\Users\KK\AppData\Local\Programs\Python\Python312\Kamlesh\K & K Parking\parking_records\Invoice_TN-73-Q-5117.pdf")
