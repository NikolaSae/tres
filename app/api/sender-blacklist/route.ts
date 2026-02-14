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
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // ✅ FIX: Bolja obrada isActive parametra
    const isActiveParam = searchParams.get('isActive');
    let isActive: boolean | undefined = undefined;
    
    if (isActiveParam === 'true') {
      isActive = true;
    } else if (isActiveParam === 'false') {
      isActive = false;
    }
    // Ako je undefined, vraćamo sve zapise (i active i inactive)

    const senderName = searchParams.get('senderName');

    console.log("[API_BLACKLIST] Query params:", { page, pageSize, isActive, senderName }); // DEBUG

    // Build where clause
    const where: any = {};
    
    // ✅ FIX: Samo filtriraj po isActive ako je eksplicitno zadat
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (senderName) {
      where.senderName = {
        contains: senderName,
        mode: 'insensitive'
      };
    }

    console.log("[API_BLACKLIST] Where clause:", where); // DEBUG

    const total = await prisma.senderBlacklist.count({ where });
    console.log("[API_BLACKLIST] Total count:", total); // DEBUG

    const totalPages = Math.ceil(total / pageSize) || 1;
    const skip = (page - 1) * pageSize;

    const blacklist = await prisma.senderBlacklist.findMany({
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
      },
      skip,
      take: pageSize,
    });

    console.log("[API_BLACKLIST] Found entries:", blacklist.length); // DEBUG

    return NextResponse.json({
      entries: blacklist,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      }
    });
  } catch (error) {
    console.error('[API_BLACKLIST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}