import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// Handler for getting parking services associated with a parking service provider
export async function GET(
  request: NextRequest,
  { params }: { params: { parkingId: string } }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const parkingId = params.parkingId;
    
    if (!parkingId) {
      return new NextResponse(JSON.stringify({ error: 'Parking Service ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Find services associated with this parking service provider
    const services = await db.service.findMany({
      where: {
        type: 'PARKING',
        contracts: {
          some: {
            contract: {
              parkingServiceId: parkingId,
            },
          },
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching parking services:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch services' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}