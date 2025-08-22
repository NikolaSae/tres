import email
from email.header import decode_header
from bs4 import BeautifulSoup
import re

def decode_header_value(value):
    decoded_parts = decode_header(value)
    decoded_str = ''.join([part.decode(encoding if encoding else 'utf-8') if isinstance(part, bytes) else part for part, encoding in decoded_parts])
    return decoded_str

def clean_body(body):
    # Remove extra whitespace, non-visible characters, and unnecessary breaks
    cleaned_body = re.sub(r'\s+', ' ', body)  # Replace multiple spaces with a single space
    cleaned_body = re.sub(r'\s+$', '', cleaned_body)  # Remove trailing spaces
    cleaned_body = re.sub(r'^\s+', '', cleaned_body)  # Remove leading spaces
    return cleaned_body

def parse_email(raw_email):
    msg = email.message_from_string(raw_email)

    # Decode email metadata
    email_from = decode_header_value(msg.get('From'))
    email_to = decode_header_value(msg.get('To'))
    email_subject = decode_header_value(msg.get('Subject'))
    email_date = msg.get('Date')

    body = ""
    
    if msg.is_multipart():
        print("This email is multipart.")
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get('Content-Disposition'))
            print(f"Part content type: {content_type}")
            
            # Look for text/plain or text/html parts
            if 'text/plain' in content_type:
                body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                break
            elif 'text/html' in content_type and not body:
                body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
    
    else:
        # If not multipart, just get the plain text body
        body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

    # If body is HTML, clean it and get the text
    if body:
        soup = BeautifulSoup(body, 'html.parser')
        body = soup.get_text()

    # Clean up body by removing unnecessary spaces
    body = clean_body(body)

    return email_from, email_to, email_subject, email_date, body

def process_email_file(file_path):
    # Open and read the email file
    with open(file_path, 'r', encoding='utf-8') as file:
        raw_email = file.read()
    
    # Parse the email content
    email_from, email_to, email_subject, email_date, body = parse_email(raw_email)

    # Print the results
    print("File:", file_path)
    print("From:", email_from)
    print("To:", email_to)
    print("Subject:", email_subject)
    print("Date:", email_date)
    print("Body:", body)

# Provide the path to your email file
email_file_path = 'E:/xampp-8-telekom/htdocs/fin-app-hub/data/emails/nekifajl.eml'  # Update this with your file path

process_email_file(email_file_path)
