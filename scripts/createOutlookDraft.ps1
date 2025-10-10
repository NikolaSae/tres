param(
    [string]$to,
    [string]$cc,
    [string]$subject,
    [string]$body,
    [string[]]$attachments
)

# Kreiraj Outlook COM objekt
$Outlook = New-Object -ComObject Outlook.Application
$Mail = $Outlook.CreateItem(0) # 0 = MailItem

# Postavi polja
$Mail.To = $to
$Mail.CC = $cc
$Mail.Subject = $subject
$Mail.Body = $body

# Dodaj attachment-e
foreach ($file in $attachments) {
    if (Test-Path $file) {
        $Mail.Attachments.Add($file)
    }
}

# Otvori draft (ne šalje)
$Mail.Display()
