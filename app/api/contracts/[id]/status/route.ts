// /app/api/contracts/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id: contractId } = await params;
    const { status, comments } = await request.json();
    
    // Validate status
    const validStatuses = [
      'ACTIVE',
      'EXPIRED',
      'TERMINATED',
      'PENDING',
      'RENEWAL_IN_PROGRESS',
      'RENEWED'
    ];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Check if contract exists
    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    // Update contract status
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
          take: 1,
          include: {
            createdBy: { select: { name: true, email: true } },
            lastModifiedBy: { select: { name: true, email: true } }
          }
        }
      }
    });
    
    // Handle renewal process logic
    if (existingContract.renewals.length > 0) {
      const latestRenewal = existingContract.renewals[0];
      
      if (status !== 'RENEWAL_IN_PROGRESS' && existingContract.status === 'RENEWAL_IN_PROGRESS') {
        // Status changed from RENEWAL_IN_PROGRESS to something else
        let renewalUpdate: any = {
          lastModifiedById: session.user.id
        };
        
        if (comments) {
          const existingNotes = latestRenewal.internalNotes || '';
          renewalUpdate.internalNotes = existingNotes 
            ? `${existingNotes}\n\nStatus changed to ${status}: ${comments}`
            : `Status changed to ${status}: ${comments}`;
        } else {
          const existingNotes = latestRenewal.internalNotes || '';
          renewalUpdate.internalNotes = existingNotes 
            ? `${existingNotes}\n\nStatus changed to ${status}`
            : `Status changed to ${status}`;
        }
        
        // Update renewal status based on contract status
        if (status === 'RENEWED') {
          renewalUpdate.subStatus = 'FINAL_PROCESSING';
          renewalUpdate.signatureReceived = true;
        } else if (status === 'TERMINATED' || status === 'EXPIRED') {
          renewalUpdate.subStatus = 'DOCUMENT_COLLECTION'; // Reset or keep as is
        }
        
        await db.contractRenewal.update({
          where: { id: latestRenewal.id },
          data: renewalUpdate
        });
      }
    }
    
    return NextResponse.json({ 
      contract: updatedContract,
      message: 'Contract status updated successfully'
    });
  } catch (error) {
    console.error('Error updating contract status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}