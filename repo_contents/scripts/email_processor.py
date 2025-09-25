import os
import logging
from email import message_from_file
from email.message import Message
from email.header import decode_header
from pathlib import Path

logging.basicConfig(
    filename="email_processor.log",
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()

def decode_mime_header(value):
    if not value:
        return None
    try:
        parts = decode_header(value)
        decoded = ''
        for part, encoding in parts:
            if isinstance(part, bytes):
                decoded += part.decode(encoding or 'utf-8', errors='replace')
            else:
                decoded += part
        return decoded
    except Exception as e:
        logger.warning(f"Failed to decode header {value}: {e}")
        return value

def extract_body(msg: Message):
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain" and not part.get_filename():
                try:
                    return part.get_payload(decode=True).decode(part.get_content_charset() or 'utf-8', errors='replace')
                except Exception as e:
                    logger.warning(f"Failed to decode body: {e}")
    else:
        try:
            return msg.get_payload(decode=True).decode(msg.get_content_charset() or 'utf-8', errors='replace')
        except Exception as e:
            logger.warning(f"Failed to decode single body: {e}")
    return None

def extract_email_data(msg: Message):
    email_data = {
        "from": decode_mime_header(msg.get("From")),
        "to": decode_mime_header(msg.get("To")),
        "cc": decode_mime_header(msg.get("Cc")),
        "subject": decode_mime_header(msg.get("Subject")),
        "body": extract_body(msg),
    }

    if not all([email_data["from"], email_data["to"], email_data["subject"], email_data["body"]]):
        logger.warning(f"Incomplete email: {email_data}")
        return None

    logger.info(f"Extracted email: {email_data['subject'][:50]}...")
    return email_data

def extract_all_emails(msg: Message):
    emails = []
    if msg.get_content_type() == "multipart/mixed":
        for part in msg.walk():
            if part.get_content_type() == "message/rfc822":
                sub_msg = part.get_payload(0)  # This is a Message object
                logger.debug("Found embedded message/rfc822.")
                email_data = extract_email_data(sub_msg)
                if email_data:
                    emails.append(email_data)
    else:
        logger.debug("No embedded emails, treating as single message.")
        email_data = extract_email_data(msg)
        if email_data:
            emails.append(email_data)
    return emails

def process_email_data(filepath):
    logger.info(f"Starting email processing for file: {filepath}")

    if not Path(filepath).exists():
        logger.error(f"File not found: {filepath}")
        return

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        msg = message_from_file(f)

    emails = extract_all_emails(msg)
    logger.info(f"Successfully parsed {len(emails)} valid emails.")
    logger.info("Extracted Data:\nfrom, to, cc, subject, body")
    for e in emails:
        logger.info(f"{e['from']} | {e['to']} | {e['cc'] or 'No CC'} | {e['subject']} | {e['body'][:60]}...")

    logger.info("Processing complete.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python email_processor.py <path-to-eml-file>")
        exit(1)
    process_email_data(sys.argv[1])
