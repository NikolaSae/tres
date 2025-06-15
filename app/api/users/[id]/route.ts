// app/api/users/[id]/route.ts

import { getUserById } from "@/data/user";
import { NextResponse } from "next/server";

// Named export for GET method
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await the params to resolve
    const resolvedParams = await params;

    const user = await getUserById(resolvedParams.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ name: user.name });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}