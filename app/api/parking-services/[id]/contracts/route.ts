//app/api/parking-services/[id]/contracts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const awaitedParams = await params;
    const parkingServiceId = awaitedParams.id;

    const parkingService = await db.parkingService.findUnique({
      where: {
        id: parkingServiceId,
      },
    });

    if (!parkingService) {
      return new NextResponse("Parking service not found", { status: 404 });
    }

    const contracts = await db.contract.findMany({
      where: {
        parkingServiceId: parkingServiceId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lastModifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: true,
        reminders: true,
        operator: { // Include the operator relation here
           select: {
              id: true,
              name: true,
           }
        }
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("[PARKING_SERVICE_CONTRACTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
