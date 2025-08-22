// /app/api/contracts/[id]/renewal/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractId = params.id;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validacija tipova datoteka
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Only PDF and DOCX files are allowed' 
      }, { status: 400 });
    }

    // Pronađi renewal
    const renewal = await db.contractRenewal.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' }
    });

    if (!renewal) {
      return NextResponse.json({ error: 'Renewal not found' }, { status: 404 });
    }

    // Kreiraj upload folder ako ne postoji
    const uploadDir = path.join(process.cwd(), 'uploads', 'contract-renewals', renewal.id);
    await mkdir(uploadDir, { recursive: true });

    // Generiši jedinstveno ime datoteke
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    // Sačuvaj datoteku
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Kreiraj database record
    const attachment = await db.contractRenewalAttachment.create({
      data: {
        renewalId: renewal.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `/uploads/contract-renewals/${renewal.id}/${fileName}`,
        description,
        uploadedById: session.user.id
      },
      include: {
        uploadedBy: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error('Error uploading renewal attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

