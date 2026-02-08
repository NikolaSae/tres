// app/api/services/bulk/[bulkId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bulkId: string }> }   // ← changed providerId → bulkId
) {
  const { bulkId } = await params;   // ← also changed here

  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!bulkId) {
      return new NextResponse(JSON.stringify({ error: 'Bulk provider ID is required' }), {
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
            providerId: bulkId   // ← use bulkId here (it's the provider ID)
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