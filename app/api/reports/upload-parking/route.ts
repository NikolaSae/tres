// app/api/reports/upload-parking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const providerId = formData.get('providerId') as string;
    const folderPath = formData.get('folderPath') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const cityName = formData.get('cityName') as string;

    console.log('Parking upload request received:', {
      fileName: file?.name,
      providerId,
      folderPath,
      startDate,
      endDate,
      cityName
    });

    if (!file || !providerId || !folderPath || !cityName) {
      console.error('Missing required fields:', { file: !!file, providerId, folderPath, cityName });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get provider details to build folder name
    const provider = await db.provider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Create folder name: "provider_name"
    const sanitizedProviderName = provider.name
      .replace(/[<>:"/\\|?*]/g, '') // Remove filesystem-dangerous characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    // Create the full folder path: reports/parking/provider_name/yyyy/mm/parking/city_name/
    const uploadsDir = path.join(
      process.cwd(), 
      'public', 
      'reports', 
      'parking',
      sanitizedProviderName, 
      folderPath
    );
    
    console.log('Creating directory:', uploadsDir);
    await mkdir(uploadsDir, { recursive: true });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsDir, file.name);
    
    console.log('Writing file to:', filePath);
    await writeFile(filePath, buffer);

    console.log('Parking upload successful');
    return NextResponse.json({ 
      message: 'Parking file uploaded successfully',
      filePath: `/reports/parking/${sanitizedProviderName}/${folderPath}/${file.name}`
    });
  } catch (error) {
    console.error('Error uploading parking file:', error);
    return NextResponse.json(
      { error: 'Failed to upload parking file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}