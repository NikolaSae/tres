// app/api/parking-services/[id]/reports/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Dodana auth provera — nedostajala
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: parkingServiceId } = await params;

    if (!parkingServiceId) {
      return NextResponse.json({ error: "Missing parking service ID" }, { status: 400 });
    }

    const parkingService = await db.parkingService.findUnique({
      where: { id: parkingServiceId },
    });

    if (!parkingService) {
      return NextResponse.json({ error: "Parking service not found" }, { status: 404 });
    }

    const reports = await db.parkingTransaction.groupBy({
      by: ["date", "group"],
      where: { parkingServiceId },
      _sum: { amount: true, quantity: true },
      _count: true,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      parkingService: { id: parkingService.id, name: parkingService.name },
      reports: reports.map((report) => ({
        id: `${report.date.toISOString()}-${report.group}`,
        title: `${report.group} - ${report.date.toLocaleDateString()}`,
        date: report.date,
        group: report.group,
        totalAmount: report._sum.amount,
        totalQuantity: report._sum.quantity,
        transactionCount: report._count,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}