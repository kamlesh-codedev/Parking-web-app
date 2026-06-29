import os
directory = "parking_records"
if not os.path.exists(directory):
    os.makedirs(directory)
    print(f"Directory '{directory}' created.")
else:
    print(f"Directory '{directory}' already exists.")

# Global counter file for bill number
bill_counter_file = os.path.join(directory, "bill_counter.txt")

def get_next_bill_number():
    """Retrieve and increment the next bill number from the counter file."""
    if not os.path.exists(bill_counter_file):
        with open(bill_counter_file, 'w') as f:
            f.write("1")
        return 1
    with open(bill_counter_file, 'r') as f:
        bill_number = int(f.read().strip())
    with open(bill_counter_file, 'w') as f:
        if bill_number<200:
            f.write(str(bill_number + 1))
        else:
            f.write(str(1))
    return bill_number
