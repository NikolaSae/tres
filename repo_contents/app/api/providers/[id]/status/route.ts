// app/api/providers/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export async function PATCH(
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

    const { isActive } = await req.json();

    // Ажурирање статуса провајдера
    const updatedProvider = await db.provider.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error("Failed to update provider status:", error);
    return NextResponse.json(
      { error: "Failed to update provider status" },
      { status: 500 }
    );
  }
}