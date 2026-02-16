// app/api/providers/[id]/renew-contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
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

    const { id: providerId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.contractNumber || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Contract number, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await db.provider.findUnique({
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
    const existingContract = await db.contract.findFirst({
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

    // Check if contract number already exists
    const duplicateContract = await db.contract.findFirst({
      where: {
        contractNumber: body.contractNumber,
        NOT: { id: existingContract.id }
      }
    });

    if (duplicateContract) {
      return NextResponse.json(
        { error: 'Contract number already exists' },
        { status: 409 }
      );
    }

    // Create new contract with renewal data
    const newContract = await db.contract.create({
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

    // Update old contract status to EXPIRED
    await db.contract.update({
      where: { id: existingContract.id },
      data: {
        status: 'EXPIRED',
        lastModifiedById: session.user.id,
      }
    });

    // ✅ Invaliduj cache
    revalidatePath('/providers');
    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/contracts');

    return NextResponse.json({
      success: true,
      contract: newContract,
      message: 'Contract renewed successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('[CONTRACT_RENEW_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}