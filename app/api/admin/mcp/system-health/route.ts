// app/api/admin/mcp/system-health/route.ts
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

    const [totalUsers, activeUsers, totalContracts, activeContracts, pendingComplaints, humanitarians] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { isActive: true } }),
        db.contract.count(),
        db.contract.count({ where: { status: 'ACTIVE' } }),
        db.complaint.count({ where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING'] } } }),
        db.humanitarianOrg.findMany({
          where: { shortNumber: { not: null } },
          select: { name: true, shortNumber: true, contactName: true, email: true, phone: true, address: true, mission: true },
          take: 20
        })
      ]);

    return Response.json({
      users: { total: totalUsers, active: activeUsers },
      contracts: { total: totalContracts, active: activeContracts },
      complaints: { pending: pendingComplaints },
      humanitarians,
      systemStatus: 'healthy',
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching system health:', error);
    return Response.json({
      error: 'Internal server error',
      users: { total: 0, active: 0 },
      contracts: { total: 0, active: 0 },
      complaints: { pending: 0 },
      humanitarians: [],
      systemStatus: 'error'
    }, { status: 500 });
  }
}