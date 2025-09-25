// app/api/mcp/my-logs/route.ts
import { auth } from '@/auth';
import { queryLogger } from '@/lib/mcp/query-logger';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized', skeleton: true }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const toolName = url.searchParams.get('toolName') || undefined;
    const fromDateParam = url.searchParams.get('fromDate');
    const toDateParam = url.searchParams.get('toDate');

    const fromDate = fromDateParam ? new Date(fromDateParam) : undefined;
    const toDate = toDateParam ? new Date(toDateParam) : undefined;

    const logs = await queryLogger.getQueryHistory(session.user.id, { 
      limit, 
      toolName,
      fromDate,
      toDate
    });

    return Response.json({ 
      logs, 
      skeleton: false,
      userId: session.user.id,
      filters: { limit, toolName, fromDate, toDate }
    });
    
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return Response.json({ 
      error: 'Internal server error', 
      skeleton: true,
      logs: []
    }, { status: 500 });
  }
}