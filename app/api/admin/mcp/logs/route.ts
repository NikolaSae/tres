// app/api/admin/mcp/logs/route.ts
import { auth } from '@/auth';
import { getRecentQueries } from '@/lib/mcp/query-logger';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized', skeleton: true }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
    const userId = url.searchParams.get('userId') || undefined;
    const toolName = url.searchParams.get('toolName') || undefined;
    const fromDateParam = url.searchParams.get('fromDate');
    const toDateParam = url.searchParams.get('toDate');

    const fromDate = fromDateParam ? new Date(fromDateParam) : undefined;
    const toDate = toDateParam ? new Date(toDateParam) : undefined;

    // Admin može da vidi sve logove, Manager samo svoje
    const targetUserId = session.user.role === 'ADMIN' ? userId : session.user.id;

    const logs = await getRecentQueries(targetUserId || session.user.id, limit);

    return Response.json({ 
      logs, 
      skeleton: false,
      filters: { limit, userId: targetUserId, toolName, fromDate, toDate },
      userRole: session.user.role
    });
    
  } catch (error) {
    console.error('Error fetching MCP logs:', error);
    return Response.json({ 
      error: 'Internal server error', 
      skeleton: true,
      logs: []
    }, { status: 500 });
  }
}