// app/api/parking-services/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }   // ← changed
) {
  try {
    const params = await context.params;          // ← await here
    const { id } = params;

    const service = await db.parkingService.findUnique({
      where: { id },
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
  context: { params: Promise<{ id: string }> }   // ← changed
) {
  try {
    const params = await context.params;          // ← await here
    const { id } = params;

    const body = await request.json();
    
    const updatedService = await db.parkingService.update({
      where: { id },
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