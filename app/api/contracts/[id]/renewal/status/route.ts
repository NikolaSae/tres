// /app/api/contracts/[id]/renewal/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { ContractRenewalSubStatus } from '@prisma/client';

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
    const { subStatus, comments } = await request.json();

    // Validate subStatus
    if (!Object.values(ContractRenewalSubStatus).includes(subStatus)) {
      return NextResponse.json({ error: 'Invalid renewal sub-status' }, { status: 400 });
    }

    // Find the latest renewal for this contract
    const existingRenewal = await db.contractRenewal.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' }
    });

    if (!existingRenewal) {
      return NextResponse.json({ error: 'Renewal not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      subStatus,
      lastModifiedById: session.user.id
    };

    // Add comments to internal notes if provided
    if (comments) {
      const existingNotes = existingRenewal.internalNotes || '';
      updateData.internalNotes = existingNotes
        ? `${existingNotes}\n\nStatus changed to ${subStatus}: ${comments}`
        : `Status changed to ${subStatus}: ${comments}`;
    }

    // Update boolean fields based on status progression
    switch (subStatus) {
      case ContractRenewalSubStatus.DOCUMENT_COLLECTION:
        // Starting phase - no automatic updates
        break;
      case ContractRenewalSubStatus.LEGAL_REVIEW:
        updateData.documentsReceived = true;
        break;
      case ContractRenewalSubStatus.FINANCIAL_REVIEW:
        updateData.documentsReceived = true;
        updateData.legalApproved = true;
        break;
      case ContractRenewalSubStatus.TECHNICAL_REVIEW:
        updateData.documentsReceived = true;
        updateData.legalApproved = true;
        updateData.financialApproved = true;
        break;
      case ContractRenewalSubStatus.MANAGEMENT_APPROVAL:
        updateData.documentsReceived = true;
        updateData.legalApproved = true;
        updateData.financialApproved = true;
        updateData.technicalApproved = true;
        break;
      case ContractRenewalSubStatus.FINAL_PROCESSING:
        updateData.documentsReceived = true;
        updateData.legalApproved = true;
        updateData.financialApproved = true;
        updateData.technicalApproved = true;
        updateData.managementApproved = true;
        updateData.signatureReceived = true;
        break;
    }

    // Update the renewal
    const updatedRenewal = await db.contractRenewal.update({
      where: { id: existingRenewal.id },
      data: updateData,
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            name: true,
            status: true
          }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        }
      }
    });

    // If renewal reaches final processing, optionally update contract status
    if (subStatus === ContractRenewalSubStatus.FINAL_PROCESSING) {
      await db.contract.update({
        where: { id: contractId },
        data: {
          status: 'ACTIVE', // or 'RENEWED' based on your business logic
          lastModifiedById: session.user.id
        }
      });
    }

    return NextResponse.json({
      renewal: updatedRenewal,
      message: 'Renewal status updated successfully'
    });

  } catch (error) {
    console.error('Error updating renewal status:', error);
    return NextResponse.json(
      { error: 'Failed to update renewal status' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contractId } = await params;

    // Find the latest renewal for this contract
    const renewal = await db.contractRenewal.findFirst({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            name: true,
            status: true
          }
        },
        createdBy: {
          select: { name: true, email: true }
        },
        lastModifiedBy: {
          select: { name: true, email: true }
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!renewal) {
      return NextResponse.json({ error: 'Renewal not found' }, { status: 404 });
    }

    return NextResponse.json({ renewal });

  } catch (error) {
    console.error('Error fetching renewal status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch renewal status' },
      { status: 500 }
    );
  }
}