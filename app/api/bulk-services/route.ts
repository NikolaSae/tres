//app/api/bulk-services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getBulkServices } from '@/actions/bulk-services/getBulkServices';
import { createBulkService } from '@/actions/bulk-services/create';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const providerId = url.searchParams.get('providerId') || undefined;
    const serviceId = url.searchParams.get('serviceId') || undefined;
    const providerName = url.searchParams.get('providerName') || undefined;
    const serviceName = url.searchParams.get('serviceName') || undefined;
    const senderName = url.searchParams.get('senderName') || undefined;
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    // Parse date filters if provided
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');
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
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[BULK_SERVICES_API]', error);
    
    // Return proper error message
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
    
    return NextResponse.json(bulkService, { status: 201 });
  } catch (error) {
    console.error('[BULK_SERVICES_API]', error);
    
    // Proper error handling with type checking
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}