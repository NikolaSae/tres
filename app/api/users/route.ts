// app/api/users/route.ts
import { connection } from 'next/server';
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  await connection();

  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    // ← bug fix: originalni filter("ADMIN", "AGENT") je bio neispravan
    const filteredUsers = users.filter(u => u.role === "ADMIN" || u.role === "AGENT");

    return NextResponse.json(filteredUsers);

  } catch (error) {
    console.error("[USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}