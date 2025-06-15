import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// Handler for getting bulk services associated with a provider
export async function GET(
  request: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const providerId = params.providerId;
    
    if (!providerId) {
      return new NextResponse(JSON.stringify({ error: 'Provider ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Find bulk services associated with this provider
    const services = await db.service.findMany({
      where: {
        type: 'BULK',
        bulkServices: {
          some: {
            providerId: providerId
          }
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
    console.error('Error fetching bulk services:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch services' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}