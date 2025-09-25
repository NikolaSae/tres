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

    // Ensure model name matches your Prisma schema
    const reports = await db.parkingReport.findMany({
      where: { parkingServiceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        status: true,
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}