// app/api/parking-services/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.parkingService.findUnique({
      where: { id: params.id },
      include: {
        // Dodajte relacije koje vam trebaju
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('[PARKING_SERVICE_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const updatedService = await prisma.parkingService.update({
      where: { id: params.id },
      data: body
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('[PARKING_SERVICE_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}