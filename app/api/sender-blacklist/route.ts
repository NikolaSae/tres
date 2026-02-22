// app/api/sender-blacklist/route.ts
import { connection } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // ← ispravljeno iz @/lib/auth
import { db } from '@/lib/db'; // ← ispravljeno iz @/lib/prisma (koristi isti db kao ostali fajlovi)

export async function GET(request: NextRequest) {
  await connection();

  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const isActiveParam = searchParams.get('isActive');
    let isActive: boolean | undefined = undefined;
    
    if (isActiveParam === 'true') {
      isActive = true;
    } else if (isActiveParam === 'false') {
      isActive = false;
    }

    const senderName = searchParams.get('senderName');

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (senderName) {
      where.senderName = {
        contains: senderName,
        mode: 'insensitive'
      };
    }

    const total = await db.senderBlacklist.count({ where });
    const totalPages = Math.ceil(total / pageSize) || 1;
    const skip = (page - 1) * pageSize;

    const blacklist = await db.senderBlacklist.findMany({
      where,
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
          select: { id: true, name: true, email: true }
        },
        modifiedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      entries: blacklist,
      pagination: { page, pageSize, total, totalPages }
    });

  } catch (error) {
    console.error('[API_BLACKLIST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}