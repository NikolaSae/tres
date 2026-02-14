// app/api/admin/mcp/logs/route.ts
import { auth } from '@/auth';
import { getQueryHistory } from '@/lib/mcp/query-logger';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized', skeleton: true }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
    const userIdParam = url.searchParams.get('userId');
    const toolName = url.searchParams.get('toolName') || undefined;
    const fromDateParam = url.searchParams.get('fromDate');
    const toDateParam = url.searchParams.get('toDate');

    const fromDate = fromDateParam ? new Date(fromDateParam) : undefined;
    const toDate = toDateParam ? new Date(toDateParam) : undefined;

    // Admin može da vidi sve logove ili specifičnog usera, Manager samo svoje
    let targetUserId: string | undefined;
    if (session.user.role === 'ADMIN') {
      targetUserId = userIdParam || undefined; // Admin može da ostavi undefined za sve usere
    } else {
      targetUserId = session.user.id;
    }

    const logs = await getQueryHistory(targetUserId, {
      limit,
      toolName,
      fromDate,
      toDate
    });

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