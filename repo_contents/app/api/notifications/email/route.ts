///app/api/notifications/email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email-sender";
import { getEmailTemplate } from "@/lib/notifications/templates";
import { NotificationType } from "@prisma/client";

// Schema for sending an email notification
const EmailNotificationSchema = z.object({
  // User IDs to send to (if not providing emails directly)
  userIds: z.array(z.string()).optional(),
  
  // Direct email addresses (use either userIds or emails)
  emails: z.array(z.string().email()).optional(),
  
  // Notification content
  subject: z.string().min(1).max(255),
  templateId: z.string().optional(),
  templateType: z.nativeEnum(NotificationType).optional(),
  templateData: z.record(z.any()).optional(),
  
  // Custom HTML content (used if no template is specified)
  htmlContent: z.string().optional(),
  
  // Optional tracking info for the system
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized or insufficient permissions" }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = EmailNotificationSchema.parse(body);
    
    // Check that either userIds or emails are provided
    if (!validatedData.userIds?.length && !validatedData.emails?.length) {
      return NextResponse.json({ error: "Either userIds or emails must be provided" }, { status: 400 });
    }
    
    // Check that either template or htmlContent is provided
    if (!validatedData.templateId && !validatedData.templateType && !validatedData.htmlContent) {
      return NextResponse.json(
        { error: "Either templateId, templateType, or htmlContent must be provided" }, 
        { status: 400 }
      );
    }
    
    // If userIds are provided, get the users' email addresses
    let emailRecipients: string[] = validatedData.emails || [];
    
    if (validatedData.userIds?.length) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: validatedData.userIds },
          isActive: true,
          email: { not: null },
        },
        select: { email: true },
      });
      
      // Add user emails to the recipients
      emailRecipients = [
        ...emailRecipients,
        ...users.map(user => user.email!).filter(Boolean),
      ];
    }
    
    // Remove duplicates
    emailRecipients = [...new Set(emailRecipients)];
    
    if (emailRecipients.length === 0) {
      return NextResponse.json({ error: "No valid email recipients found" }, { status: 400 });
    }
    
    // Get or build the email content
    let htmlContent = validatedData.htmlContent;
    
    if (!htmlContent && (validatedData.templateId || validatedData.templateType)) {
      // Get the template and apply the data
      const template = await getEmailTemplate(
        validatedData.templateId || validatedData.templateType!,
        validatedData.templateData || {}
      );
      
      htmlContent = template;
    }
    
    if (!htmlContent) {
      return NextResponse.json({ error: "Failed to generate email content" }, { status: 500 });
    }
    
    // Send the emails
    const results = await Promise.all(
      emailRecipients.map(async (email) => {
        try {
          await sendEmail({
            to: email,
            subject: validatedData.subject,
            html: htmlContent!,
          });
          return { email, success: true };
        } catch (error) {
          console.error(`Failed to send email to ${email}:`, error);
          return { email, success: false, error: (error as Error).message };
        }
      })
    );
    
    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: "SEND_EMAIL_NOTIFICATIONS",
        entityType: validatedData.entityType || "EMAIL",
        entityId: validatedData.entityId,
        details: `Sent ${successCount} emails (${failureCount} failed) with subject "${validatedData.subject}"`,
        userId: session.user.id,
        severity: failureCount > 0 ? "WARNING" : "INFO",
      },
    });
    
    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      total: emailRecipients.length,
      details: results,
    });
  } catch (error) {
    console.error("Error sending email notifications:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email notification data", details: error.errors }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to send email notifications" }, 
      { status: 500 }
    );
  }
}