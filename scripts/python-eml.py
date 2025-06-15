


import extract_msg
import re
import csv

def parse_msg(file_path):
    msg = extract_msg.Message(file_path)
    
    # Extracting relevant parts
    subject = msg.subject
    from_ = msg.sender
    to = msg.to
    date = msg.date
    body = msg.body
    
    return {
        'subject': subject,
        'from': from_,
        'to': to,
        'date': date,
        'body': body
    }

def clean_body(body):
    # Uklanjanje \r\n karaktera
    body = body.replace('\r\n', ' ')
    # Uklanjanje nevidljivih karaktera, uključujući U+00A0
    body = re.sub(r'[\u00A0]', ' ', body)
    return body

def split_conversation(body):
    # Regex patterns for reply, reply to all, and forward
    reply_pattern = re.compile(r'(On .* wrote:|From: .*|Sent: .*|To: .*|Subject: .*)', re.IGNORECASE)
    forward_pattern = re.compile(r'(Forwarded message|Fwd:)', re.IGNORECASE)
    
    # Split body based on patterns
    replies = reply_pattern.split(body)
    forwards = forward_pattern.split(body)
    
    return {
        'replies': replies,
        'forwards': forwards
    }

def save_to_csv(data, file_name):
    with open(file_name, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['Subject', 'From', 'To', 'Date', 'Replies', 'Forwards'])
        
        for item in data:
            writer.writerow([
                item['subject'],
                item['from'],
                item['to'],
                item['date'],
                " | ".join(item['replies']),
                " | ".join(item['forwards'])
            ])


# Example usage for .msg file
msg_data = parse_msg('/workspaces/fin-app-hub/test.msg')
msg_data['body'] = clean_body(msg_data['body'])
conversation_parts_msg = split_conversation(msg_data['body'])
msg_data.update(conversation_parts_msg)

# Combine data for CSV output
combined_data = [msg_data]

# Save to CSV
save_to_csv(combined_data, '/workspaces/fin-app-hub/email_conversations.csv')

print("Email conversations have been saved to email_conversations.csv")


