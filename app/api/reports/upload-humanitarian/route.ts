// app/api/reports/upload-humanitarian/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db'; // adjust import path as needed

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;
    const folderPath = formData.get('folderPath') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    console.log('Upload request received:', {
      fileName: file?.name,
      organizationId,
      folderPath,
      startDate,
      endDate
    });

    if (!file || !organizationId || !folderPath) {
      console.error('Missing required fields:', { file: !!file, organizationId, folderPath });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get organization details to build folder name
    const organization = await db.humanitarianOrg.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Create folder name: "kratki_broj - ime_organizacije"
    // Better sanitization that preserves Cyrillic and special characters
    const sanitizedOrgName = organization.name
      .replace(/[<>:"/\\|?*]/g, '') // Remove only filesystem-dangerous characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
    
    const orgFolderName = `${organization.shortNumber || 'unknown'} - ${sanitizedOrgName}`;
    
    // Create the full folder path: reports/kratki_broj - ime_organizacije/yyyy/mm/
    const uploadsDir = path.join(process.cwd(), 'public', 'reports', orgFolderName, folderPath);
    
    console.log('Creating directory:', uploadsDir);
    await mkdir(uploadsDir, { recursive: true });

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsDir, file.name);
    
    console.log('Writing file to:', filePath);
    await writeFile(filePath, buffer);

    // Optionally save file info to database (uncomment if you have ReportFile model)
    // await db.reportFile.create({
    //   data: {
    //     fileName: file.name,
    //     filePath: `/reports/${orgFolderName}/${folderPath}/${file.name}`,
    //     organizationId: organizationId,
    //     startDate: new Date(startDate),
    //     endDate: new Date(endDate),
    //     fileSize: file.size,
    //     mimeType: file.type,
    //     uploadedAt: new Date()
    //   }
    // });

    console.log('Upload successful');
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      filePath: `/reports/${orgFolderName}/${folderPath}/${file.name}`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}