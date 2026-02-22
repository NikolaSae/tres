// app/api/reports/upload-humanitarian/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { auth } from '@/auth';
import { db } from '@/lib/db';

// ✅ Uklonjeno: runtime = 'nodejs' — Node.js je jedini runtime u Next.js 16

export async function POST(request: NextRequest) {
  try {
    // ✅ Dodana auth provera — nedostajala
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;
    const folderPath = formData.get('folderPath') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    if (!file || !organizationId || !folderPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const organization = await db.humanitarianOrg.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const sanitizedOrgName = organization.name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const orgFolderName = `${organization.shortNumber || 'unknown'} - ${sanitizedOrgName}`;

    const uploadsDir = path.join(
      process.cwd(),
      'public',
      'reports',
      orgFolderName,
      folderPath
    );

    await mkdir(uploadsDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileSavePath = path.join(uploadsDir, file.name);
    await writeFile(fileSavePath, buffer);

    const reportType = folderPath.includes('postpaid') ? 'POSTPAID' : 'PREPAID';
    const publicPath = `/reports/${orgFolderName}/${folderPath}/${file.name}`;

    await db.reportFile.create({
      data: {
        fileName: file.name,
        filePath: publicPath,
        fileSize: file.size,
        mimeType: file.type,
        category: 'HUMANITARIAN',
        organizationId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reportType,
        isMonthlyReport: startDate.endsWith('-01'),
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'File uploaded successfully', filePath: publicPath });
  } catch (error) {
    console.error('Error uploading humanitarian file:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}