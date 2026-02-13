// app/api/parking-services/[id]/reports/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Properly await the params promise
    const { id } = await params;
    const parkingServiceId = id;

    if (!parkingServiceId) {
      return NextResponse.json(
        { error: "Missing parking service ID" },
        { status: 400 }
      );
    }

    // First, verify the parking service exists
    const parkingService = await db.parkingService.findUnique({
      where: { id: parkingServiceId },
    });

    if (!parkingService) {
      return NextResponse.json(
        { error: "Parking service not found" },
        { status: 404 }
      );
    }

    // Get transactions grouped by date or other report-like data
    const transactions = await db.parkingTransaction.findMany({
      where: { parkingServiceId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        group: true,
        serviceName: true,
        amount: true,
        quantity: true,
        createdAt: true,
      },
      take: 100, // Limit for performance
    });

    // Or if you want to aggregate by date for a report-like structure
    const reports = await db.parkingTransaction.groupBy({
      by: ['date', 'group'],
      where: { parkingServiceId },
      _sum: {
        amount: true,
        quantity: true,
      },
      _count: true,
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ 
      parkingService: {
        id: parkingService.id,
        name: parkingService.name,
      },
      reports: reports.map(report => ({
        id: `${report.date.toISOString()}-${report.group}`,
        title: `${report.group} - ${report.date.toLocaleDateString()}`,
        date: report.date,
        group: report.group,
        totalAmount: report._sum.amount,
        totalQuantity: report._sum.quantity,
        transactionCount: report._count,
      }))
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}