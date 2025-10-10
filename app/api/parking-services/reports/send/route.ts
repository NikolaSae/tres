// app/api/parking-services/reports/send/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { promises as fs } from 'fs';
import { generateParkingReportEmail } from "@/lib/email-templates/parking-report-email";
import { getMonthName, detectReportType } from "@/utils/parking-reports-helper";
import open from "open"; // npm i open

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { serviceId, serviceName, email, additionalEmails, reports, year, month } = body;

    if (!serviceId || !serviceName || !reports || reports.length === 0) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const recipients = [email, ...(Array.isArray(additionalEmails) ? additionalEmails : [])].filter(Boolean);

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No email recipients configured" }, { status: 400 });
    }

    // Pripremi email telo
    const reportType = reports[0].type || detectReportType(reports[0].name);
    const monthName = getMonthName(parseInt(month));

    const emailHtml = generateParkingReportEmail({
      serviceName,
      monthName,
      year,
      reports: reports.map(r => ({ name: r.name, type: r.type || reportType })),
      attachmentCount: reports.length,
      reportType,
    });

    // mailto link
    const subject = `Mesečni ${reportType} izveštaj - ${serviceName} - ${monthName} ${year}`;
    const bodyText = emailHtml.replace(/<[^>]+>/g, ''); // plain text version

    const mailtoUrl = `mailto:${recipients.join(';')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

    console.log(`📨 Opening Outlook draft for ${recipients.length} recipient(s)...`);

    // Otvori Outlook draft
    await open(mailtoUrl);

    console.log("✅ Outlook draft opened successfully!");

    // Log draft creation
    const { db } = await import("@/lib/db");
    await db.activityLog.create({
      data: {
        action: "REPORT_DRAFT_OPENED",
        entityType: "ParkingService",
        entityId: serviceId,
        details: `Opened draft for ${reports.length} ${reportType} report(s) for ${monthName} ${year} to ${recipients.join(', ')}`,
        severity: "INFO",
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Outlook draft opened for ${recipients.length} recipient(s)`,
      reportType,
    });

  } catch (error: any) {
    console.error("💥 Error opening Outlook draft:", error);
    return NextResponse.json({ error: "Failed to open draft: " + error.message }, { status: 500 });
  }
}
