// app/api/operators/contracts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ova ruta ne prima operatorId preko params → moraš ga dobiti na neki drugi način
    // Najčešće opcije:
    // 1. Iz query parametra → npr. /api/operators/contracts?operatorId=abc123
    // 2. Iz body-ja (ali GET obično ne koristi body)
    // 3. Ili ova ruta treba da vraća UGOVORE ZA SVE operatere (ne za jednog)

    // Primer 1: Dohvatanje operatorId iz query stringa
    const operatorId = req.nextUrl.searchParams.get("operatorId");

    if (!operatorId) {
      return NextResponse.json(
        { error: "operatorId is required (query parameter)" },
        { status: 400 }
      );
    }

    // Provera da li operator postoji
    const operator = await db.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    // Dohvatanje svih ugovora za tog operatora
    const contracts = await db.contract.findMany({
      where: { operatorId },
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
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}