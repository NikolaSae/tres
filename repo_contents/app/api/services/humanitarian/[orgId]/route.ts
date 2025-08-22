import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// Handler for getting humanitarian services associated with a humanitarian organization
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const orgId = params.orgId;
    
    if (!orgId) {
      return new NextResponse(JSON.stringify({ error: 'Humanitarian Organization ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Find services associated with this humanitarian organization through contracts
    const services = await db.service.findMany({
      where: {
        type: 'HUMANITARIAN',
        contracts: {
          some: {
            contract: {
              humanitarianOrgId: orgId,
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
    console.error('Error fetching humanitarian services:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch services' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}