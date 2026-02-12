// app/api/providers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: providerId } = await params;

    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        _count: {
          select: {
            contracts: true,
            vasServices: true,
            bulkServices: true,
            complaints: true,
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Check if provider has related data
    if (
      provider._count.contracts > 0 ||
      provider._count.vasServices > 0 ||
      provider._count.bulkServices > 0 ||
      provider._count.complaints > 0
    ) {
      return NextResponse.json(
        { 
          error: 'Cannot delete provider with existing contracts, services, or complaints',
          details: {
            contracts: provider._count.contracts,
            vasServices: provider._count.vasServices,
            bulkServices: provider._count.bulkServices,
            complaints: provider._count.complaints,
          }
        },
        { status: 400 }
      );
    }

    // Delete the provider
    await prisma.provider.delete({
      where: { id: providerId }
    });

    return NextResponse.json({ success: true, message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: providerId } = await params;

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contracts: true,
            vasServices: true,
            bulkServices: true,
            complaints: true,
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}