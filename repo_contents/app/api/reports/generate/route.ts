///app/api/reports/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Assuming your Prisma client is exported as db
import { auth } from "@/auth"; // Assuming your NextAuth options are here
import { generateExcelReport } from "@/lib/reports/excel-generator"; // Assuming this function exists
import { logActivity } from "@/actions/security/log-event"; // Assuming this action exists
import { ReportStatus } from "@prisma/client"; // Assuming you have a ReportStatus enum in Prisma

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id; // Get the user ID from the session

  // Prepare activity log payload
  const activityLogPayload = {
    userId: userId || null, // Log null if user is not authenticated
    entityType: 'Report', // or 'ReportGeneration'
    entityId: null, // Will be set after report is saved to DB
    activityType: 'GENERATE',
    details: {} as any, // Details will be filled based on the request and outcome
    status: 'FAILED' as 'SUCCESS' | 'FAILED', // Default to FAILED, update on success
  };

  try {
    // Check authentication
    if (!userId) {
      activityLogPayload.details = { message: "Unauthorized attempt to generate report" };
      await logActivity(activityLogPayload);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Check permissions
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      activityLogPayload.details = { message: "Insufficient permissions to generate report", userId };
      await logActivity(activityLogPayload);
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { reportType, parameters, name } = data;

    // Basic input validation
    if (!reportType || !name) {
      activityLogPayload.details = { message: "Report type and name are required", userId, requestData: data };
      await logActivity(activityLogPayload);
      return NextResponse.json(
        { error: "Report type and name are required" },
        { status: 400 }
      );
    }

    // Store parameters in log details (excluding potentially sensitive data)
    activityLogPayload.details = { reportType, reportName: name, parameters };

    // Generate unique report name with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const generatedReportName = `${name}_${timestamp}`;

    let reportData: any;
    let fileUrl: string | null = null; // Initialize fileUrl

    // Fetch data and generate report based on report type
    switch (reportType) {
      case "financial": { // Use block scope for switch cases to avoid variable conflicts
        const { startDate, endDate, providerId, ...restParams } = parameters || {};

        const where: any = {};

        if (startDate && endDate) {
          // Assuming mesec_pruzanja_usluge is a Date or DateTime field
          where.mesec_pruzanja_usluge = {
            gte: new Date(startDate),
            lte: new Date(endDate),
          };
        }

        if (providerId) {
          where.provajderId = providerId;
        }

        reportData = await db.vasService.findMany({
          where,
          include: {
            service: true,
            provider: true,
          },
        });

        // Generate Excel report
        fileUrl = await generateExcelReport(
          "financial",
          generatedReportName, // Use the unique generated name
          reportData,
          parameters // Pass original parameters to generator for column/grouping options
        );
        break;
      }

      case "sales": { // Use block scope
        const salesWhere: any = {};
        const { salesStartDate, salesEndDate, salesProviderId, ...restParams } = parameters || {};

        if (salesStartDate && salesEndDate) {
          salesWhere.mesec_pruzanja_usluge = {
            gte: new Date(salesStartDate),
            lte: new Date(salesEndDate),
          };
        }

        if (salesProviderId) {
          salesWhere.provajderId = salesProviderId;
        }

        reportData = await db.vasService.findMany({
          where: salesWhere,
          include: {
            service: true,
            provider: true,
          },
        });

        // Generate Excel report
        fileUrl = await generateExcelReport(
          "sales",
          generatedReportName, // Use the unique generated name
          reportData,
          parameters // Pass original parameters
        );
        break;
      }

      case "contracts": { // Use block scope
        const { contractStatus, contractType, ...restParams } = parameters || {};

        const contractWhere: any = {};

        if (contractStatus) {
          contractWhere.status = contractStatus;
        }

        if (contractType) {
          contractWhere.type = contractType;
        }

        reportData = await db.contract.findMany({
          where: contractWhere,
          include: {
            provider: true,
            humanitarianOrg: true,
            parkingService: true,
            createdBy: {
              select: { name: true, email: true },
            },
          },
        });

        // Generate Excel report
        fileUrl = await generateExcelReport(
          "contracts",
          generatedReportName, // Use the unique generated name
          reportData,
          parameters // Pass original parameters
        );
        break;
      }

      case "complaints": { // Use block scope
        const { complaintStatus, priority, serviceId, ...restParams } = parameters || {};

        const complaintWhere: any = {};

        if (complaintStatus) {
          complaintWhere.status = complaintStatus;
        }

        if (priority) {
          complaintWhere.priority = priority;
        }

        if (serviceId) {
          complaintWhere.serviceId = serviceId;
        }

        reportData = await db.complaint.findMany({
          where: complaintWhere,
          include: {
            service: true,
            product: true,
            provider: true,
            submittedBy: {
              select: { name: true, email: true },
            },
            assignedAgent: {
              select: { name: true, email: true },
            },
          },
        });

        // Generate Excel report
        fileUrl = await generateExcelReport(
          "complaints",
          generatedReportName, // Use the unique generated name
          reportData,
          parameters // Pass original parameters
        );
        break; // Added break
      }

      default:
        // Handle unsupported report types
        activityLogPayload.details.message = `Unsupported report type: ${reportType}`;
        await logActivity(activityLogPayload);
        return NextResponse.json(
          { error: `Unsupported report type: ${reportType}` },
          { status: 400 }
        );
    }

    // If fileUrl was not generated (e.g., generateExcelReport failed or returned null)
    if (!fileUrl) {
         activityLogPayload.details.message = `Excel file generation failed for report type: ${reportType}`;
         await logActivity(activityLogPayload);
         return NextResponse.json(
             { error: "Failed to generate Excel file" },
             { status: 500 } // Internal server error for generation failure
         );
    }


    // Save report metadata to the database
    const savedReport = await db.report.create({
      data: {
        name: generatedReportName, // Save the unique generated name
        reportType: reportType, // Save the requested type
        parameters: parameters, // Save the original parameters as JSON
        fileUrl: fileUrl,
        status: ReportStatus.GENERATED, // Assuming GENERATED is a valid status
        generatedById: userId,
        createdAt: new Date(),
      },
    });

    // Update activity log with success status and entity ID
    activityLogPayload.entityId = savedReport.id;
    activityLogPayload.status = 'SUCCESS';
    activityLogPayload.details.message = `Report generated successfully: ${savedReport.name}`;
    await logActivity(activityLogPayload);

    // Return success response with file URL
    return NextResponse.json({
      success: true,
      reportId: savedReport.id,
      name: savedReport.name,
      fileUrl: savedReport.fileUrl,
      status: savedReport.status,
      createdAt: savedReport.createdAt,
    }, { status: 200 });

  } catch (error) {
    console.error("Error generating report:", error);

    // Log the error as part of the activity details if not already set
    if (!activityLogPayload.details.message) {
        activityLogPayload.details.message = "An unexpected error occurred during report generation.";
    }
    activityLogPayload.details.error = error instanceof Error ? error.message : String(error);
    activityLogPayload.status = 'FAILED';
    // Ensure userId is logged even if the initial auth check failed within the try block
    if (!activityLogPayload.userId && session?.user?.id) {
        activityLogPayload.userId = session.user.id;
    }

    // Attempt to log the failed activity
    try {
      await logActivity(activityLogPayload);
    } catch (logError) {
      console.error("Failed to log report generation activity:", logError);
      // Continue without throwing if logging fails
    }


    // Return error response
    return NextResponse.json(
      { error: "Failed to generate report", details: (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}