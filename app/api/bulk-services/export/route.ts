// app/api/bulk-services/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { exportBulkServices } from '@/actions/bulk-services/export';

// ✅ Uklonjeno: dynamic i revalidate

export async function GET(req: NextRequest) {
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

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set(
      'Content-Disposition',
      `attachment; filename="bulk-services-export-${new Date().toISOString().split('T')[0]}.csv"`
    );
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(result.csvContent, { status: 200, headers });
  } catch (error) {
    console.error('[EXPORT_BULK_SERVICES_API]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}