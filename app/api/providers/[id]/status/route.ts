// app/api/providers/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
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
      select: { id: true, isActive: true }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
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

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error('Error updating provider status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}