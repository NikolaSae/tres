// app/api/bulk-services/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getBulkServiceById } from '@/actions/bulk-services/getBulkServiceById';
import { updateBulkService } from '@/actions/bulk-services/update';
import { deleteBulkService } from '@/actions/bulk-services/delete';

// Force dynamic rendering - koristi auth
export const dynamic = 'force-dynamic';

// Cache GET requests for individual bulk service
export const revalidate = 120; // 2 minutes for detail page

// Type-safe params interface
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await context.params;
    const bulkService = await getBulkServiceById(id);
    
    if (!bulkService) {
      return NextResponse.json({ error: 'Bulk service not found' }, { status: 404 });
    }
    
    // Add cache headers
    const response = NextResponse.json(bulkService);
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=240');
    
    return response;
  } catch (error) {
    console.error('[BULK_SERVICE_BY_ID_API]', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await context.params;
    const data = await req.json();
    const updatedBulkService = await updateBulkService(id, data);
    
    // Could trigger cache revalidation here
    // revalidateTag(`bulk-service-${id}`);
    // revalidateTag('bulk-services');
    
    return NextResponse.json(updatedBulkService);
  } catch (error) {
    console.error('[UPDATE_BULK_SERVICE_API]', error);
    
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

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await context.params;
    await deleteBulkService(id);
    
    // Could trigger cache revalidation here
    // revalidateTag('bulk-services');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_BULK_SERVICE_API]', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}