// app/api/complaints/[id]/attachments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const complaintId = params.id;

    // Verify complaint exists and user has access
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        submittedBy: {
          select: {
            id: true
          }
        }
      }
    });

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      complaint.submittedBy.id !== session.user.id &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const attachments = await prisma.attachment.findMany({
      where: { complaintId },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        uploadedAt: true,
        complaintId: true,
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const complaintId = params.id;

    // Verify complaint exists and user has access
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        submittedBy: {
          select: {
            id: true
          }
        }
      }
    });

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      complaint.submittedBy.id !== session.user.id &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (optional)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'attachments');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        fileUrl: `/uploads/attachments/${uniqueFilename}`,
        fileType: file.type,
        complaintId: complaintId,
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        uploadedAt: true,
        complaintId: true,
      }
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'Attachment ID is required' },
        { status: 400 }
      );
    }

    // Get attachment with complaint and submitter info
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        complaintId: true,
        complaint: {
          select: {
            submittedById: true
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (
      attachment.complaint.submittedById !== session.user.id &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'MANAGER'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}