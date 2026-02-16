// app/api/bulk-services/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getBulkServices } from '@/actions/bulk-services/getBulkServices';
import { createBulkService } from '@/actions/bulk-services/create';

// Force dynamic rendering - koristi auth
export const dynamic = 'force-dynamic';

// Cache GET requests for 60 seconds (revalidate on demand via tags)
export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const providerId = searchParams.get('providerId') || undefined;
    const serviceId = searchParams.get('serviceId') || undefined;
    const providerName = searchParams.get('providerName') || undefined;
    const serviceName = searchParams.get('serviceName') || undefined;
    const senderName = searchParams.get('senderName') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Parse date filters if provided
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    
    const result = await getBulkServices({
      page,
      limit,
      providerId,
      serviceId,
      providerName,
      serviceName,
      senderName,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
    
    // Add cache headers for client-side caching
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error('[BULK_SERVICES_API]', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    const bulkService = await createBulkService(data);
    
    // After creating, could trigger revalidation
    // revalidateTag('bulk-services'); // If you set up tags
    
    return NextResponse.json(bulkService, { status: 201 });
  } catch (error) {
    console.error('[BULK_SERVICES_API]', error);
    
    // Handle Zod validation errors
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: (error as any).issues 
      }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}