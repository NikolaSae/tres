// app/api/providers/[id]/renew-contract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const user = session?.user;

    // Провера ауторизације
    if (!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role as UserRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Тражење провајдера
    const provider = await db.provider.findUnique({
      where: { id: params.id },
      include: {
        contracts: {
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Ако провајдер има постојеће уговоре, користити последњи за референцу
    const latestContract = provider.contracts[0];
    const startDate = new Date();
    
    // Крајњи датум је годину дана од почетног
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    // Креирање новог уговора
    const newContract = await db.contract.create({
      data: {
        providerId: provider.id,
        startDate,
        endDate,
        value: latestContract?.value || 0,
        terms: latestContract?.terms || "",
        isActive: true,
      },
    });

    return NextResponse.json(newContract);
  } catch (error) {
    console.error("Failed to renew contract:", error);
    return NextResponse.json(
      { error: "Failed to renew contract" },
      { status: 500 }
    );
  }
}