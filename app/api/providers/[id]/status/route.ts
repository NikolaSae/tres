// app/api/providers/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
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

    // Validate input
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, isActive: true, name: true }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Check if status is actually changing
    if (provider.isActive === body.isActive) {
      return NextResponse.json(
        { 
          message: 'Status already set to this value',
          provider: {
            id: provider.id,
            isActive: provider.isActive,
          }
        },
        { status: 200 }
      );
    }

    // Update provider status
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        isActive: body.isActive,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      }
    });

    // ✅ Invaliduj cache
    revalidatePath('/providers');
    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/api/providers');

    return NextResponse.json({
      success: true,
      provider: updatedProvider,
      message: `Provider ${body.isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('[PROVIDER_STATUS_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}