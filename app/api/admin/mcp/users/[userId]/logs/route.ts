// app/api/admin/mcp/users/[userId]/logs/route.ts
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getRecentQueries } from '@/lib/mcp/query-logger';
import { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Await params before using
    const { userId } = await params;
    
    if (!userId) {
      return Response.json({ 
        error: 'User ID required',
        logs: []
      }, { status: 400 });
    }

    // Provjeri da li korisnik postoji
    const userExists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!userExists) {
      return Response.json({ 
        error: 'User not found',
        logs: []
      }, { status: 404 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 500);
    const fromDateParam = url.searchParams.get('fromDate');
    const toDateParam = url.searchParams.get('toDate');
    const toolName = url.searchParams.get('toolName') || undefined;

    const fromDate = fromDateParam ? new Date(fromDateParam) : undefined;
    const toDate = toDateParam ? new Date(toDateParam) : undefined;

    // Validate dates
    if (fromDate && isNaN(fromDate.getTime())) {
      return Response.json({ 
        error: 'Invalid fromDate format',
        logs: []
      }, { status: 400 });
    }
    
    if (toDate && isNaN(toDate.getTime())) {
      return Response.json({ 
        error: 'Invalid toDate format', 
        logs: []
      }, { status: 400 });
    }

    const logs = await queryLogger.getQueryHistory(userId, { 
      limit, 
      fromDate, 
      toDate,
      toolName
    });

    // Dodaj dodatne statistike ako je potrebno
    const stats = {
      totalQueries: logs.length,
      uniqueTools: [...new Set(logs.map(log => log.toolName))].length,
      dateRange: {
        from: fromDate?.toISOString() || null,
        to: toDate?.toISOString() || null
      }
    };

    return Response.json({
      user: userExists,
      logs,
      stats,
      totalCount: logs.length,
      filters: { fromDate, toDate, toolName, limit }
    });
    
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return Response.json({
      error: 'Internal server error',
      logs: []
    }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Await params before using
    const { userId } = await params;
    const url = new URL(req.url);
    const olderThanDays = Number(url.searchParams.get('olderThanDays') || 30);

    if (!userId) {
      return Response.json({ 
        error: 'User ID required'
      }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const deletedCount = await queryLogger.clearOldLogs(userId, cutoffDate);

    return Response.json({
      message: `Deleted ${deletedCount} log entries older than ${olderThanDays} days`,
      deletedCount,
      cutoffDate: cutoffDate.toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting user logs:', error);
    return Response.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}