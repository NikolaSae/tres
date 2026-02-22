// app/api/admin/mcp/users/list/route.ts
import { connection } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  await connection();
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100);
    const search = url.searchParams.get('search')?.toLowerCase().trim();
    const role = url.searchParams.get('role');
    const isActive = url.searchParams.get('isActive');
    const offset = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && role !== 'all') where.role = role;
    if (isActive !== null && isActive !== 'all') where.isActive = isActive === 'true';

    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          _count: {
            select: {
              createdContracts: true,
              submittedComplaints: true,
              assignedComplaints: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      db.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return Response.json({
      users,
      pagination: { page, limit, totalCount, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      filters: { search, role, isActive }
    });

  } catch (error) {
    console.error('Error fetching users list:', error);
    return Response.json({ error: 'Internal server error', users: [], pagination: null }, { status: 500 });
  }
}