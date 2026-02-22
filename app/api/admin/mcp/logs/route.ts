// app/api/admin/mcp/logs/route.ts
import { connection } from 'next/server';
import { auth } from '@/auth';
import { getQueryHistory } from '@/lib/mcp/query-logger';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  await connection();
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized', skeleton: true }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
    const userIdParam = url.searchParams.get('userId');
    const toolName = url.searchParams.get('toolName') || undefined;
    const fromDate = url.searchParams.get('fromDate') ? new Date(url.searchParams.get('fromDate')!) : undefined;
    const toDate = url.searchParams.get('toDate') ? new Date(url.searchParams.get('toDate')!) : undefined;

    const targetUserId = session.user.role === 'ADMIN' ? (userIdParam || undefined) : session.user.id;

    const logs = await getQueryHistory(targetUserId, { limit, toolName, fromDate, toDate });

    return Response.json({
      logs,
      skeleton: false,
      filters: { limit, userId: targetUserId, toolName, fromDate, toDate },
      userRole: session.user.role
    });

  } catch (error) {
    console.error('Error fetching MCP logs:', error);
    return Response.json({ error: 'Internal server error', skeleton: true, logs: [] }, { status: 500 });
  }
}