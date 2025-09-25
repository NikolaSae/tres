// app/api/operators/contracts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if operator exists
    const operator = await db.operator.findUnique({
      where: { id },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    // Get all contracts associated with this operator
    const contracts = await db.contract.findMany({
      where: { operatorId: id },
      orderBy: { startDate: "desc" },
      include: {
        provider: {
          select: {
            name: true,
          },
        },
        humanitarianOrg: {
          select: {
            name: true,
          },
        },
        parkingService: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching operator contracts:", error);
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
  }
}