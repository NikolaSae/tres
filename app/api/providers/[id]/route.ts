// app/api/providers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ✅ Cached funkcija za single provider
const getCachedProvider = unstable_cache(
  async (providerId: string) => {
    console.log(`🔍 Fetching provider ${providerId} from database...`);

    return prisma.provider.findUnique({
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
  },
  ['provider-detail'],
  { 
    revalidate: 60,
  }
);

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

    // ✅ Koristi cached funkciju
    const provider = await getCachedProvider(providerId);

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
    
  } catch (error) {
    console.error('[PROVIDER_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: providerId } = await params;
    const body = await request.json();

    // Check if provider exists
    const existingProvider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true }
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update provider
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        isActive: body.isActive,
        imageUrl: body.imageUrl,
      },
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
      }
    });

    // ✅ Invaliduj cache posle update
    revalidatePath('/providers');
    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/api/providers');

    return NextResponse.json(updatedProvider);
    
  } catch (error) {
    console.error('[PROVIDER_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Check permissions
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: providerId } = await params;

    // Check if provider exists and has related data
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
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

    // Check for related data
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

    // ✅ Invaliduj cache posle delete
    revalidatePath('/providers');
    revalidatePath(`/providers/${providerId}`);
    revalidatePath('/api/providers');

    return NextResponse.json({ 
      success: true, 
      message: 'Provider deleted successfully' 
    });
    
  } catch (error) {
    console.error('[PROVIDER_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}