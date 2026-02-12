// app/api/sender-blacklist/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const blacklist = await prisma.senderBlacklist.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: {
        id: true,
        senderName: true,
        effectiveDate: true,
        description: true,
        isActive: true,
        matchCount: true,
        lastMatchDate: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        modifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(blacklist);
  } catch (error) {
    console.error('Error fetching sender blacklist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    if (!body.senderName || !body.effectiveDate) {
      return NextResponse.json(
        { error: 'Sender name and effective date are required' },
        { status: 400 }
      );
    }

    const blacklistEntry = await prisma.senderBlacklist.create({
      data: {
        senderName: body.senderName,
        effectiveDate: new Date(body.effectiveDate),
        description: body.description,
        isActive: body.isActive ?? true,
        createdById: session.user.id,
      },
      select: {
        id: true,
        senderName: true,
        effectiveDate: true,
        description: true,
        isActive: true,
        matchCount: true,
        lastMatchDate: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(blacklistEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating blacklist entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}