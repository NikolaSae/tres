// app/api/bulk-services/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { exportBulkServices } from '@/actions/bulk-services/export';

// Force dynamic rendering - koristi auth
export const dynamic = 'force-dynamic';

// NO CACHING for exports - always fresh data
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId') || undefined;
    const serviceId = searchParams.get('serviceId') || undefined;
    const providerName = searchParams.get('providerName') || undefined;
    const serviceName = searchParams.get('serviceName') || undefined;
    
    const result = await exportBulkServices({
      providerId,
      serviceId,
      providerName,
      serviceName,
    });
    
    // Set headers for file download - NO CACHING
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="bulk-services-export-${new Date().toISOString().split('T')[0]}.csv"`);
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return new NextResponse(result.csvContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[EXPORT_BULK_SERVICES_API]', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}