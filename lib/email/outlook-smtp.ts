// lib/email/outlook-smtp.ts
import nodemailer from 'nodemailer';

export interface EmailAttachment {
  filename: string;
  content: string; // base64
}

export interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Šalje email preko Outlook/Office365 SMTP servera
 */
export async function sendEmailViaOutlook(params: SendEmailParams) {
  const { to, subject, html, attachments = [] } = params;

  // Kreiraj SMTP transporter za Outlook
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-mail.outlook.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true za port 465, false za ostale portove
    auth: {
      user: process.env.SMTP_USER, // tvoj Outlook email
      pass: process.env.SMTP_PASSWORD, // tvoja lozinka ili app password
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
  } catch (error: any) {
    console.error('❌ SMTP connection failed:', error);
    throw new Error(`SMTP connection failed: ${error.message}`);
  }

  // Pripremi attachmente
  const emailAttachments = attachments.map(att => ({
    filename: att.filename,
    content: Buffer.from(att.content, 'base64'),
  }));

  // Pošalji email
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: to.join(', '),
    subject,
    html,
    attachments: emailAttachments,
  });

  console.log('✅ Email sent:', info.messageId);
  return { id: info.messageId, success: true };
}