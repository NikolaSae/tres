///app/api/bulk-services/import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { importBulkServices } from '@/actions/bulk-services/import';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Invalid file format. Only CSV files are supported.' }, { status: 400 });
    }
    
    // Read file content
    const fileContent = await file.text();
    
    // Process the file
    const result = await importBulkServices(fileContent);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[IMPORT_BULK_SERVICES_API]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}