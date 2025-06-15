// app/api/users/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Only allow admins or agents to fetch user list
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Fetch users (bez in filtera koji koristi nevalidne vrednosti)
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        role: true // Dodajemo role za filtriranje na frontend-u
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    // Za svaki slučaj možemo ovde filtrirati korisnike sa AGENT ulogom
    // ako postoji u vašem sistemu
    const agentUsers = users.filter(user => user.role === "ADMIN", "AGENT");
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}