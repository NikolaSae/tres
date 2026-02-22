// /app/api/services/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { ServiceType, Prisma } from '@prisma/client';

// ✅ Uklonjeno: 'use server' — API rute nisu Server Actions

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const typeParam = searchParams.get('type');

    // ✅ Prisma.ServiceWhereInput umesto any
    const where: Prisma.ServiceWhereInput = {};

    if (typeParam) {
      const validServiceTypes = Object.values(ServiceType);
      if (!validServiceTypes.includes(typeParam as ServiceType)) {
        return NextResponse.json(
          { error: `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}` },
          { status: 400 }
        );
      }
      where.type = typeParam as ServiceType;
    }

    const services = await db.service.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Failed to fetch services." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implementirati kada bude dostupna createService akcija
    return NextResponse.json(
      { error: "Service creation not yet implemented." },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Failed to create service." }, { status: 500 });
  }
}