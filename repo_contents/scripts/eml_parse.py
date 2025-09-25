import os
import pandas as pd
from datetime import datetime
import extract_msg

# Podesi putanju do foldera sa .msg fajlovima
msg_directory = "E:/xampp-8-telekom/htdocs/fin-app-hub/scripts/email/"  # <- Izmeni ovo

# Lista za čuvanje rezultata
email_data = []

# Prolazak kroz sve .msg fajlove u folderu
for filename in os.listdir(msg_directory):
    if filename.lower().endswith(".msg"):
        file_path = os.path.join(msg_directory, filename)
        try:
            msg = extract_msg.Message(file_path)
            msg_sender = msg.sender
            msg_to = msg.to
            msg_subject = msg.subject
            msg_date = msg.date
            msg_body = msg.body

            # Pretvaranje datuma u datetime za sortiranje
            try:
                parsed_date = datetime.strptime(msg_date, "%a, %d %b %Y %H:%M:%S %z")
            except Exception:
                parsed_date = None

            email_data.append({
                "Subject": msg_subject,
                "From": msg_sender,
                "To": msg_to,
                "Date": parsed_date,
                "Body": msg_body.strip() if msg_body else ""
            })

        except Exception as e:
            print(f"Greška u fajlu {filename}: {e}")

# Sortiranje po datumu
email_data_sorted = sorted(email_data, key=lambda x: x["Date"] or datetime.min)

# Upis u CSV
df = pd.DataFrame(email_data_sorted)
output_csv = os.path.join(msg_directory, "konverzacija.csv")
df.to_csv(output_csv, index=False, encoding="utf-8-sig")

print(f"CSV fajl sačuvan: {output_csv}")
