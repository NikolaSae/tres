// app/api/humanitarian-orgs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const includeRenewals = searchParams.get('includeRenewals') === 'true';

    const orgs = await prisma.humanitarianOrg.findMany({
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        mission: true,
        pib: true,
        registrationNumber: true,
        bank: true,
        accountNumber: true,
        shortNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        ...(includeRenewals && {
          renewals: {
            select: {
              id: true,
              renewalStartDate: true,
              proposedStartDate: true,
              proposedEndDate: true,
              subStatus: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              renewalStartDate: 'desc'
            }
          }
        }),
        _count: {
          select: {
            complaints: true,
            renewals: true,
            contracts: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(orgs);
  } catch (error) {
    console.error('Error fetching humanitarian organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const org = await prisma.humanitarianOrg.create({
      data: {
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        website: body.website,
        mission: body.mission,
        pib: body.pib,
        registrationNumber: body.registrationNumber,
        bank: body.bank,
        accountNumber: body.accountNumber,
        shortNumber: body.shortNumber,
        isActive: body.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        mission: true,
        pib: true,
        registrationNumber: true,
        bank: true,
        accountNumber: true,
        shortNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(org, { status: 201 });
  } catch (error) {
    console.error('Error creating humanitarian organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}