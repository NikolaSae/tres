///app/api/bulk-services/route.ts

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
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    
    const result = await getBulkServices({
      page,
      limit,
      providerId,
      serviceId,
      providerName,
      serviceName,
      sortBy,
      sortOrder,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[BULK_SERVICES_API]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}