// /app/api/contracts/[id]/renewal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // Updated import path
import { db } from '@/lib/db';
import { ContractRenewalSubStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractId = params.id;

    const renewal = await db.contractRenewal.findFirst({
      where: { contractId },
      include: {
        attachments: {
          include: {
            uploadedBy: {
              select: { name: true, email: true }
            }
          },
          orderBy: { uploadedAt: 'desc' }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ renewal });
  } catch (error) {
    console.error('Error fetching contract renewal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch renewal data' },
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contractId = params.id;
    const body = await request.json();
    
    const {
      proposedStartDate,
      proposedEndDate,
      proposedRevenue,
      comments,
      internalNotes,
      documentsReceived = false,
      legalApproved = false,
      financialApproved = false,
      technicalApproved = false,
      managementApproved = false,
      signatureReceived = false,
      subStatus = ContractRenewalSubStatus.DOCUMENT_COLLECTION
    } = body;

    const contract = await db.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if renewal already exists
    const existingRenewal = await db.contractRenewal.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' }
    });

    if (existingRenewal) {
      return NextResponse.json({ error: 'Renewal already exists for this contract' }, { status: 409 });
    }

    const renewal = await db.contractRenewal.create({
      data: {
        contractId,
        subStatus,
        proposedStartDate: new Date(proposedStartDate),
        proposedEndDate: new Date(proposedEndDate),
        proposedRevenue,
        comments,
        internalNotes,
        documentsReceived,
        legalApproved,
        financialApproved,
        technicalApproved,
        managementApproved,
        signatureReceived,
        createdById: session.user.id
      },
      include: {
        attachments: {
          include: {
            uploadedBy: {
              select: { name: true, email: true }
            }
          }
        },
        createdBy: {
          select: { name: true, email: true }
        }
      }
    });

    // Update contract status
    await db.contract.update({
      where: { id: contractId },
      data: {
        status: 'RENEWAL_IN_PROGRESS',
        lastModifiedById: session.user.id
      }
    });

    return NextResponse.json({ renewal }, { status: 201 });
  } catch (error) {
    console.error('Error creating contract renewal:', error);
    return NextResponse.json(
      { error: 'Failed to create renewal' },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    
    const {
      subStatus,
      proposedStartDate,
      proposedEndDate,
      proposedRevenue,
      comments,
      internalNotes,
      documentsReceived,
      legalApproved,
      financialApproved,
      technicalApproved,
      managementApproved,
      signatureReceived
    } = body;

    const existingRenewal = await db.contractRenewal.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' }
    });

    if (!existingRenewal) {
      return NextResponse.json({ error: 'Renewal not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      lastModifiedById: session.user.id
    };

    if (subStatus !== undefined) updateData.subStatus = subStatus;
    if (proposedStartDate !== undefined) updateData.proposedStartDate = new Date(proposedStartDate);
    if (proposedEndDate !== undefined) updateData.proposedEndDate = new Date(proposedEndDate);
    if (proposedRevenue !== undefined) updateData.proposedRevenue = proposedRevenue;
    if (comments !== undefined) updateData.comments = comments;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (documentsReceived !== undefined) updateData.documentsReceived = documentsReceived;
    if (legalApproved !== undefined) updateData.legalApproved = legalApproved;
    if (financialApproved !== undefined) updateData.financialApproved = financialApproved;
    if (technicalApproved !== undefined) updateData.technicalApproved = technicalApproved;
    if (managementApproved !== undefined) updateData.managementApproved = managementApproved;
    if (signatureReceived !== undefined) updateData.signatureReceived = signatureReceived;

    const updatedRenewal = await db.contractRenewal.update({
      where: { id: existingRenewal.id },
      data: updateData,
      include: {
        attachments: {
          include: {
            uploadedBy: {
              select: { name: true, email: true }
            }
          },
          orderBy: { uploadedAt: 'desc' }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({ renewal: updatedRenewal });
  } catch (error) {
    console.error('Error updating contract renewal:', error);
    return NextResponse.json(
      { error: 'Failed to update renewal' },
      { status: 500 }
    );
  }
}