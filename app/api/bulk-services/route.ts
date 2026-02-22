// app/api/bulk-services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getBulkServices } from '@/actions/bulk-services/getBulkServices';
import { createBulkService } from '@/actions/bulk-services/create';

// ✅ Uklonjeno: dynamic i revalidate

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const result = await getBulkServices({
      page,
      limit,
      providerId: searchParams.get('providerId') || undefined,
      serviceId: searchParams.get('serviceId') || undefined,
      providerName: searchParams.get('providerName') || undefined,
      serviceName: searchParams.get('serviceName') || undefined,
      senderName: searchParams.get('senderName') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
    });

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    console.error('[BULK_SERVICES_API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
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

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: (error as { issues: unknown }).issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}