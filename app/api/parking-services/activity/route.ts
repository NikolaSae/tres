import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json({ error: "Missing serviceId" }, { status: 400 });
  }

  const logs = await db.activityLog.findMany({
    where: { entityId: serviceId, entityType: "ParkingService" },
    orderBy: { createdAt: "desc" }, // Changed from timestamp to createdAt
    take: 20,
  });

  return NextResponse.json({ logs });
}