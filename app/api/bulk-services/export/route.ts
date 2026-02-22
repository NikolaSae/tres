// app/api/bulk-services/export/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { exportBulkServices } from '@/actions/bulk-services/export';

export async function GET(req: NextRequest) {
  await connection();

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const result = await exportBulkServices({
      providerId: searchParams.get('providerId') || undefined,
      serviceId: searchParams.get('serviceId') || undefined,
      providerName: searchParams.get('providerName') || undefined,
      serviceName: searchParams.get('serviceName') || undefined,
    });

    return new NextResponse(result.csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bulk-services-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('[EXPORT_BULK_SERVICES_API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}