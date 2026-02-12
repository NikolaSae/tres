// app/api/providers/[id]/renew-contract/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Check if user has permission (ADMIN or MANAGER only)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const providerId = params.id;
    const body = await request.json();

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Find existing active contract
    const existingContract = await prisma.contract.findFirst({
      where: {
        providerId: providerId,
        status: 'ACTIVE',
        type: 'PROVIDER'
      },
      select: {
        id: true,
        contractNumber: true,
        name: true,
        revenuePercentage: true,
      }
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'No active contract found for this provider' },
        { status: 404 }
      );
    }

    // Create new contract with renewal data
    const newContract = await prisma.contract.create({
      data: {
        name: body.name || `${provider.name} - Renewed Contract`,
        contractNumber: body.contractNumber,
        type: 'PROVIDER',
        status: 'PENDING',
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        revenuePercentage: body.revenuePercentage || existingContract.revenuePercentage,
        description: body.description,
        providerId: providerId,
        createdById: session.user.id,
        operatorRevenue: body.operatorRevenue,
        isRevenueSharing: body.isRevenueSharing ?? true,
        operatorId: body.operatorId,
      },
      select: {
        id: true,
        name: true,
        contractNumber: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        revenuePercentage: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Update old contract status to EXPIRED or TERMINATED
    await prisma.contract.update({
      where: { id: existingContract.id },
      data: {
        status: 'EXPIRED',
        lastModifiedById: session.user.id,
      }
    });

    return NextResponse.json(newContract, { status: 201 });
  } catch (error) {
    console.error('Error renewing contract:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}