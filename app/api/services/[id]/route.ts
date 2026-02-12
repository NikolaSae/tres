// app/api/services/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    const serviceId = params.id;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        contracts: {
          include: {
            contract: {
              select: {
                id: true,
                name: true,
                contractNumber: true,
                status: true,
                startDate: true,
                endDate: true,
              }
            }
          }
        },
        complaints: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
        },
        vasServices: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                contactName: true,
                address: true,
                isActive: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          },
          orderBy: {
            mesec_pruzanja_usluge: 'desc'
          },
          take: 10,
        },
        bulkServices: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                contactName: true,
                address: true,
                isActive: true,
                imageUrl: true,
                createdAt: true,
                updatedAt: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
        },
        _count: {
          select: {
            complaints: true,
            contracts: true,
            vasServices: true,
            bulkServices: true,
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const serviceId = params.id;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        _count: {
          select: {
            contracts: true,
            complaints: true,
            vasServices: true,
            bulkServices: true,
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check if service has related data
    if (
      service._count.contracts > 0 ||
      service._count.complaints > 0 ||
      service._count.vasServices > 0 ||
      service._count.bulkServices > 0
    ) {
      return NextResponse.json(
        { 
          error: 'Cannot delete service with existing contracts, complaints, or transactions',
          details: {
            contracts: service._count.contracts,
            complaints: service._count.complaints,
            vasServices: service._count.vasServices,
            bulkServices: service._count.bulkServices,
          }
        },
        { status: 400 }
      );
    }

    // Delete the service
    await prisma.service.delete({
      where: { id: serviceId }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Service deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}