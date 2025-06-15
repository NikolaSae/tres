// app/api/contracts/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ContractStatus, ContractRenewalSubStatus } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;
    const body = await request.json();
    const { newStatus, comments } = body;

    console.log('🔍 API Route - Starting updateContractStatus:', { contractId, newStatus, comments });

    // Validacija input parametara
    if (!contractId || !contractId.trim()) {
      console.error('❌ Invalid contractId:', contractId);
      return NextResponse.json({
        success: false,
        message: 'Contract ID is required'
      }, { status: 400 });
    }

    if (!Object.values(ContractStatus).includes(newStatus)) {
      console.error('❌ Invalid contract status:', newStatus);
      return NextResponse.json({
        success: false,
        message: 'Invalid contract status'
      }, { status: 400 });
    }

    // Validacija da ugovor postoji
    const existingContract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        renewals: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    console.log('📄 Found contract:', existingContract ? 'Yes' : 'No');
    if (!existingContract) {
      console.error('❌ Contract not found with ID:', contractId);
      return NextResponse.json({
        success: false,
        message: 'Contract not found'
      }, { status: 404 });
    }

    console.log('🏷️ Current status:', existingContract.status, '-> New status:', newStatus);

    // Validacija business logike
    const validationResult = validateStatusChange(existingContract.status, newStatus);
    console.log('✅ Validation result:', validationResult);
    
    if (!validationResult.isValid) {
      console.error('❌ Status change validation failed:', validationResult.message);
      return NextResponse.json({
        success: false,
        message: validationResult.message
      }, { status: 400 });
    }

    // Update contract status
    console.log('💾 Updating contract status...');
    const updatedContract = await db.contract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    console.log('✅ Contract updated successfully');

    // If starting renewal, create a new renewal record
    if (newStatus === ContractStatus.RENEWAL_IN_PROGRESS) {
      console.log('🔄 Creating renewal record...');
      
      try {
        await db.contractRenewal.create({
          data: {
            contractId: contractId,
            subStatus: ContractRenewalSubStatus.DOCUMENT_COLLECTION,
            proposedStartDate: existingContract.endDate,
            proposedEndDate: new Date(existingContract.endDate.getTime() + (365 * 24 * 60 * 60 * 1000)), // +1 year
            proposedRevenue: existingContract.revenuePercentage,
            documentsReceived: false,
            legalApproved: false,
            financialApproved: false,
            technicalApproved: false,
            managementApproved: false,
            signatureReceived: false,
            comments: comments || 'Renewal process started',
            createdById: 'system', // Replace with actual user ID from session
          }
        });
        console.log('✅ Renewal record created successfully');
      } catch (renewalError) {
        console.error('❌ Error creating renewal record:', renewalError);
        // Ne prekidamo proces ako renewal kreiranje ne uspe
        // ali logujemo grešku
      }
    }

    return NextResponse.json({
      success: true,
      message: `Contract status updated to ${newStatus.replace(/_/g, ' ').toLowerCase()}`,
      contract: updatedContract,
      shouldRefresh: true
    });

  } catch (error) {
    console.error('❌ Error in updateContractStatus API:', error);
    
    // Specifične greške za Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      console.error('Prisma error code:', prismaError.code);
      console.error('Prisma error meta:', prismaError.meta);
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json({
          success: false,
          message: 'Contract not found or already deleted'
        }, { status: 404 });
      }
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          message: 'Database constraint violation'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update contract status: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

function validateStatusChange(currentStatus: ContractStatus, newStatus: ContractStatus) {
  console.log('🔍 Validating status change:', { currentStatus, newStatus });
  
  const validTransitions: Record<ContractStatus, ContractStatus[]> = {
    [ContractStatus.DRAFT]: [ContractStatus.ACTIVE, ContractStatus.TERMINATED],
    [ContractStatus.ACTIVE]: [ContractStatus.RENEWAL_IN_PROGRESS, ContractStatus.EXPIRED, ContractStatus.TERMINATED],
    [ContractStatus.PENDING]: [ContractStatus.ACTIVE, ContractStatus.RENEWAL_IN_PROGRESS, ContractStatus.TERMINATED],
    [ContractStatus.RENEWAL_IN_PROGRESS]: [ContractStatus.ACTIVE, ContractStatus.EXPIRED, ContractStatus.TERMINATED],
    [ContractStatus.EXPIRED]: [ContractStatus.RENEWAL_IN_PROGRESS, ContractStatus.TERMINATED],
    [ContractStatus.TERMINATED]: [] // No transitions from terminated
  };

  const allowedTransitions = validTransitions[currentStatus] || [];
  console.log('📋 Allowed transitions from', currentStatus, ':', allowedTransitions);
  
  if (!allowedTransitions.includes(newStatus)) {
    const errorMessage = `Cannot change status from ${currentStatus.replace(/_/g, ' ')} to ${newStatus.replace(/_/g, ' ')}`;
    console.error('❌ Invalid transition:', errorMessage);
    return {
      isValid: false,
      message: errorMessage
    };
  }

  console.log('✅ Status change validation passed');
  return { isValid: true, message: '' };
}