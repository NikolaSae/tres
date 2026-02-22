// app/api/operators/contracts/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth"; // ← ispravljeno iz @/lib/auth

export async function GET(req: NextRequest) {
  await connection();

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const operatorId = req.nextUrl.searchParams.get("operatorId");
    if (!operatorId) {
      return NextResponse.json(
        { error: "operatorId is required (query parameter)" },
        { status: 400 }
      );
    }

    const operator = await db.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const contracts = await db.contract.findMany({
      where: { operatorId },
      orderBy: { startDate: "desc" },
      include: {
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } },
      },
    });

    return NextResponse.json(contracts);

  } catch (error) {
    console.error("Error fetching operator contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}