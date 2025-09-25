import os
import re
import pandas as pd
from datetime import datetime
from email import policy
from email.parser import BytesParser
from bs4 import BeautifulSoup

# 📂 Folder sa .eml fajlovima
eml_folder = "E:/xampp-8-telekom/htdocs/fin-app-hub/scripts/email/"

# 🧹 Čišćenje tela poruke
def clean_body(text):
    if not text:
        return ""

    remove_patterns = [
        r"(?i)^--\s*$",                         
        r"(?i)^Poverljive informacije.*",
        r"(?i)^Skrećemo vam pažnju.*",
        r"(?i)^Sačuvajmo drveće.*",
        r"(?i)^Save a tree.*",
        r"(?i)^\*{3,}.*",
        r"(?i)^─────────────.*",
        r"(?i)^Adresa:.*",
        r"(?i)^• m:.*",
        r"(?i)^http[s]?://.*",
        r"(?i)^<mailto:.*>",
        r"(?i)^Ako nije neophodno.*",
        r"(?i)^Najlakši način.*"
    ]

    lines = text.splitlines()
    cleaned = []
    for line in lines:
        if any(re.match(pat, line.strip()) for pat in remove_patterns):
            continue
        if line.strip() == "":
            continue
        cleaned.append(line.strip())

    return "\n".join(cleaned).strip()

# 📥 Lista za e-mail poruke
emails = []

for file in os.listdir(eml_folder):
    if file.lower().endswith(".eml"):
        file_path = os.path.join(eml_folder, file)
        with open(file_path, 'rb') as f:
            msg = BytesParser(policy=policy.default).parse(f)

        subject = msg.get('subject', '')
        sender = msg.get('from', '')
        recipient = msg.get('to', '')
        date = msg.get('date', '')

        try:
            parsed_date = datetime.strptime(date[:25], "%a, %d %b %Y %H:%M:%S %z")
        except Exception:
            parsed_date = None

        # 📩 Parsiranje tela
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                if ctype == "text/plain":
                    body = part.get_content()
                    break
                elif ctype == "text/html" and not body:
                    html = part.get_content()
                    body = BeautifulSoup(html, "html.parser").get_text()
        else:
            body = msg.get_content()

        emails.append({
            "Subject": subject,
            "From": sender,
            "To": recipient,
            "Date": parsed_date,
            "Body": clean_body(body)
        })

# 📊 Sortiranje i eksport
emails_sorted = sorted(emails, key=lambda x: x["Date"] or datetime.min)
df = pd.DataFrame(emails_sorted)
output_path = os.path.join(eml_folder, "konverzacija.csv")
df.to_csv(output_path, index=False, encoding="utf-8-sig")

print(f"✅ CSV fajl sačuvan: {output_path}")
