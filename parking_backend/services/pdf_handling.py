import os

def delete_invoice(pdf_path):
    if not os.path.exists(pdf_path):
        return False
    try:
        os.remove(pdf_path)
        return True
    except:
        return False