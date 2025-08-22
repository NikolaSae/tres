///app/api/bulk-services/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { exportBulkServices } from '@/actions/bulk-services/export';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters for filtering
    const url = new URL(req.url);
    const providerId = url.searchParams.get('providerId') || undefined;
    const serviceId = url.searchParams.get('serviceId') || undefined;
    const providerName = url.searchParams.get('providerName') || undefined;
    const serviceName = url.searchParams.get('serviceName') || undefined;
    
    const result = await exportBulkServices({
      providerId,
      serviceId,
      providerName,
      serviceName,
    });
    
    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="bulk-services-export.csv"');
    
    return new NextResponse(result.csvContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[EXPORT_BULK_SERVICES_API]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}