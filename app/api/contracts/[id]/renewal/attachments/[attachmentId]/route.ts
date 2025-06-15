// /app/api/contracts/[id]/renewal/attachments/[attachmentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contractId, attachmentId } = params;

    // Find the attachment
    const attachment = await db.contractRenewalAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        renewal: {
          select: { contractId: true }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Verify the attachment belongs to the correct contract
    if (attachment.renewal.contractId !== contractId) {
      return NextResponse.json({ error: 'Attachment does not belong to this contract' }, { status: 403 });
    }

    // Delete the file from filesystem
    try {
      const fullPath = path.join(process.cwd(), attachment.filePath.replace(/^\//, ''));
      await unlink(fullPath);
    } catch (fileError) {
      console.warn('Failed to delete file from filesystem:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the database record
    await db.contractRenewalAttachment.delete({
      where: { id: attachmentId }
    });

    return NextResponse.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting renewal attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}