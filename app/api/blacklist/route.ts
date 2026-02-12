
// app/api/blacklist/route.ts
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const senderName = searchParams.get('senderName');
    const providerId = searchParams.get('providerId');
    const isActive = searchParams.get('isActive');
    const effectiveDate = searchParams.get('effectiveDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (senderName) {
      where.senderName = {
        contains: senderName,
        mode: 'insensitive'
      };
    }
    
    if (providerId) {
      where.providerId = providerId;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (effectiveDate) {
      where.effectiveDate = {
        gte: new Date(effectiveDate)
      };
    }

    // ✅ ISPRAVKA: Uklonjena nevalidna orderBy sintaksa i uklonjen provider include
    const [blacklist, total] = await Promise.all([
      db.senderBlacklist.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { lastMatchDate: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.senderBlacklist.count({ where })
    ]);

    return NextResponse.json({
      blacklist,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error("Error fetching blacklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch blacklist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { senderName, effectiveDate, description, isActive } = body;

    if (!senderName || !effectiveDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ ISPRAVKA: Uklonjen provider include
    const blacklistEntry = await db.senderBlacklist.create({
      data: {
        senderName,
        effectiveDate: new Date(effectiveDate),
        description,
        isActive: isActive ?? true,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(blacklistEntry, { status: 201 });

  } catch (error) {
    console.error("Error creating blacklist entry:", error);
    return NextResponse.json(
      { error: "Failed to create blacklist entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Blacklist entry ID is required" },
        { status: 400 }
      );
    }

    // ✅ ISPRAVKA: Uklonjen provider include
    const blacklistEntry = await db.senderBlacklist.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(blacklistEntry);

  } catch (error) {
    console.error("Error updating blacklist entry:", error);
    return NextResponse.json(
      { error: "Failed to update blacklist entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Blacklist entry ID is required" },
        { status: 400 }
      );
    }

    await db.senderBlacklist.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting blacklist entry:", error);
    return NextResponse.json(
      { error: "Failed to delete blacklist entry" },
      { status: 500 }
    );
  }
}