//app/api/bulk-services/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getBulkServiceById } from '@/actions/bulk-services/getBulkServiceById';
import { updateBulkService } from '@/actions/bulk-services/update';
import { deleteBulkService } from '@/actions/bulk-services/delete';

export async function GET(
  req: NextRequest,
  // ✅ ISPRAVKA: Dodat tip parametar za Promise
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const bulkService = await getBulkServiceById(id);
    
    if (!bulkService) {
      return NextResponse.json({ error: 'Bulk service not found' }, { status: 404 });
    }
    
    return NextResponse.json(bulkService);
  } catch (error) {
    console.error('[BULK_SERVICE_BY_ID_API]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const data = await req.json();
    const updatedBulkService = await updateBulkService(id, data);
    
    return NextResponse.json(updatedBulkService);
  } catch (error) {
    console.error('[UPDATE_BULK_SERVICE_API]', error);
    
    // ✅ ISPRAVKA: Proper type assertion
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: (error as any).errors }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    await deleteBulkService(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_BULK_SERVICE_API]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}