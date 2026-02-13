// app/api/parking-services/[id]/reports/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parkingServiceId = id;

    if (!parkingServiceId) {
      return NextResponse.json(
        { error: "Missing parking service ID" },
        { status: 400 }
      );
    }

    // Verify parking service exists
    const parkingService = await db.parkingService.findUnique({
      where: { id: parkingServiceId },
    });

    if (!parkingService) {
      return NextResponse.json(
        { error: "Parking service not found" },
        { status: 404 }
      );
    }

    // Get aggregated transaction data as "reports"
    const reports = await db.parkingTransaction.groupBy({
      by: ['date'],
      where: { parkingServiceId },
      _sum: {
        amount: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Format as report objects
    const formattedReports = reports.map((report) => ({
      id: report.date.toISOString(),
      title: `Report for ${report.date.toLocaleDateString('sr-RS')}`,
      createdAt: report.date,
      status: 'completed',
      totalAmount: report._sum.amount || 0,
      totalQuantity: report._sum.quantity || 0,
      transactionCount: report._count.id,
    }));

    return NextResponse.json({ reports: formattedReports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}