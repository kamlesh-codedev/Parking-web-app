import subprocess
import os

SAVE_FILE = "failed_messages.json"

SUMATRA_PATH = r"C:\Users\DELL\AppData\Local\SumatraPDF\SumatraPDF.exe"

def auto_print_pdf(file_path, printer_name=None):
    if not os.path.exists(file_path):
        return False

    command = [SUMATRA_PATH]

    if printer_name:
        command += ["-print-to", printer_name]
    else:
        command += ["-print-to-default"]

    command += ["-print-settings", "noscale"]
    command.append(file_path)

    try:
        subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )
        return True
    except subprocess.CalledProcessError:
        return False
    