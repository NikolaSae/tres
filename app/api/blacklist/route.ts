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

    // Get blacklist entries with pagination
    const [blacklist, total] = await Promise.all([
      db.senderBlacklist.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { lastMatchDate: { sort: 'desc', nulls: 'last' } },
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

    // Get all bulk providers
    const bulkProviders = await db.provider.findMany({
      where: {
        type: "BULK"
      },
      select: {
        id: true,
        name: true
      }
    });

    if (bulkProviders.length === 0) {
      return NextResponse.json(
        { error: "No bulk providers found" },
        { status: 400 }
      );
    }

    // Check if entries already exist for any provider
    const existingEntries = await db.senderBlacklist.findMany({
      where: {
        senderName,
        providerId: {
          in: bulkProviders.map(p => p.id)
        }
      },
      include: {
        provider: {
          select: {
            name: true
          }
        }
      }
    });

    if (existingEntries.length > 0) {
      const providerNames = existingEntries.map(e => e.provider.name).join(", ");
      return NextResponse.json(
        { error: `Blacklist entry already exists for this sender on providers: ${providerNames}` },
        { status: 400 }
      );
    }

    // Create blacklist entries for all bulk providers
    await db.senderBlacklist.createMany({
      data: bulkProviders.map(provider => ({
        senderName,
        providerId: provider.id,
        effectiveDate: new Date(effectiveDate),
        description,
        isActive: isActive ?? true,
        createdById: session.user.id
      }))
    });

    // Get the created entries with relations
    const blacklistEntries = await db.senderBlacklist.findMany({
      where: {
        senderName,
        providerId: {
          in: bulkProviders.map(p => p.id)
        }
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: `Blacklist entry created for ${bulkProviders.length} bulk providers`,
      entries: blacklistEntries
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating blacklist entry:", error);
    return NextResponse.json(
      { error: "Failed to create blacklist entry" },
      { status: 500 }
    );
  }
}