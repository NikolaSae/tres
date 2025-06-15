// /app/api/contracts/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const contractId = params.id;
    const { status, comments } = await request.json();
    
    // Ažuriraj status ugovora
    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: {
        status,
        lastModifiedById: session.user.id
      },
      include: {
        provider: { select: { name: true } },
        humanitarianOrg: { select: { name: true } },
        parkingService: { select: { name: true } },
        renewals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    // Ako je status promenjen iz RENEWAL_IN_PROGRESS, možda treba dodatna logika
    if (status !== 'RENEWAL_IN_PROGRESS' && updatedContract.renewals.length > 0) {
      // Možda dodaj komentar ili završi renewal proces
      await db.contractRenewal.update({
        where: { id: updatedContract.renewals[0].id },
        data: {
          internalNotes: comments ? `Status changed to ${status}: ${comments}` : `Status changed to ${status}`,
          lastModifiedById: session.user.id
        }
      });
    }
    
    return NextResponse.json({ contract: updatedContract });
  } catch (error) {
    console.error('Error updating contract status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}