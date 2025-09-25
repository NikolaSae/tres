// app/api/admin/mcp/search-humanitarian-orgs/route.ts
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q')?.trim() || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200); // Max 200
    const onlyWithShortNumbers = url.searchParams.get('shortNumbers') === 'true';

    const whereClause: any = {
      isActive: true,
      ...(onlyWithShortNumbers && { shortNumber: { not: null } })
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { shortNumber: { contains: query } },
        { email: { contains: query, mode: 'insensitive' } },
        { contactName: { contains: query, mode: 'insensitive' } }
      ];
    }

    const orgs = await db.humanitarianOrg.findMany({
      where: whereClause,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        shortNumber: true,
        email: true,
        phone: true,
        contactName: true,
        address: true,
        mission: true,
        createdAt: true
      }
    });

    return Response.json({ 
      results: orgs,
      query,
      totalFound: orgs.length,
      limit
    });
    
  } catch (error) {
    console.error('Error fetching humanitarian orgs:', error);
    return Response.json({ 
      error: 'Internal server error',
      results: []
    }, { status: 500 });
  }
}