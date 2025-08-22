//app/api/bulk-services/[id]/route.ts


import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getBulkServiceById } from '@/actions/bulk-services/getBulkServiceById';
import { updateBulkService } from '@/actions/bulk-services/update';
import { deleteBulkService } from '@/actions/bulk-services/delete';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const bulkService = await getBulkServiceById(params.id);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    const updatedBulkService = await updateBulkService(params.id, data);
    
    return NextResponse.json(updatedBulkService);
  } catch (error) {
    console.error('[UPDATE_BULK_SERVICE_API]', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await deleteBulkService(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE_BULK_SERVICE_API]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}