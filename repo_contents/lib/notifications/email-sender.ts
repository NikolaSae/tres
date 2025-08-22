////lib/notifications/email-sender.ts


import nodemailer from 'nodemailer';
import { Notification, NotificationType, User } from '@prisma/client';
import { db } from '@/lib/db';
import { getEmailTemplate } from './templates';
import { logEvent } from '@/actions/security/log-event';

// Email configuration - use environment variables in production
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  },
  from: process.env.EMAIL_FROM || 'notifications@yourcompany.com'
};

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth
});

/**
 * Send email notification to a user
 */
export async function sendEmailNotification({
  user,
  subject,
  templateName,
  templateData,
  attachments = []
}: {
  user: User | string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  attachments?: Array<{filename: string; path: string}>;
}) {
  try {
    // Get user if only ID was provided
    let userEmail: string;
    let userId: string;
    
    if (typeof user === 'string') {
      const userRecord = await db.user.findUnique({
        where: { id: user },
        select: { id: true, email: true }
      });
      
      if (!userRecord) {
        throw new Error(`User with ID ${user} not found`);
      }
      
      userEmail = userRecord.email;
      userId = userRecord.id;
    } else {
      userEmail = user.email;
      userId = user.id;
    }
    
    // Get HTML content from template
    const html = getEmailTemplate(templateName, templateData);
    
    // Send email
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: userEmail,
      subject,
      html,
      attachments
    });
    
    // Log the email sending
    await logEvent({
      action: 'SEND_EMAIL',
      entityType: 'email',
      entityId: info.messageId,
      details: `Email sent to ${userEmail}`,
      severity: 'INFO',
      userId: 'system'
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SENDER_ERROR]', error);
    
    // Log the error
    await logEvent({
      action: 'SEND_EMAIL_ERROR',
      entityType: 'email',
      details: `Failed to send email: ${(error as Error).message}`,
      severity: 'ERROR',
      userId: 'system'
    });
    
    return { success: false, error };
  }
}

/**
 * Send notification email based on notification object
 */
export async function sendNotificationEmail(notification: Notification) {
  try {
    const user = await db.user.findUnique({
      where: { id: notification.userId }
    });
    
    if (!user) {
      throw new Error(`User with ID ${notification.userId} not found`);
    }
    
    let templateName = 'general';
    let subject = notification.title;
    let templateData: Record<string, any> = {
      title: notification.title,
      message: notification.message,
      userName: user.name || user.email,
      actionUrl: process.env.NEXT_PUBLIC_APP_URL
    };
    
    // Configure template based on notification type
    switch (notification.type) {
      case NotificationType.CONTRACT_EXPIRING:
        templateName = 'contract-expiring';
        templateData.entityId = notification.entityId;
        templateData.actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${notification.entityId}`;
        break;
        
      case NotificationType.COMPLAINT_ASSIGNED:
        templateName = 'complaint-assigned';
        templateData.entityId = notification.entityId;
        templateData.actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/complaints/${notification.entityId}`;
        break;
        
      case NotificationType.CONTRACT_RENEWAL_STATUS_CHANGE:
        templateName = 'contract-renewal';
        templateData.entityId = notification.entityId;
        templateData.actionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contracts/${notification.entityId}`;
        break;
        
      // Add other notification types as needed
    }
    
    // Send the email
    return await sendEmailNotification({
      user,
      subject,
      templateName,
      templateData
    });
  } catch (error) {
    console.error('[NOTIFICATION_EMAIL_ERROR]', error);
    return { success: false, error };
  }
}

/**
 * Send a batch of emails to multiple users
 */
export async function sendBulkEmails({
  users,
  subject,
  templateName,
  templateData,
}: {
  users: User[] | string[];
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
}) {
  const results = [];
  
  for (const user of users) {
    const result = await sendEmailNotification({
      user,
      subject,
      templateName,
      templateData
    });
    
    results.push(result);
  }
  
  return results;
}