// app/api/admin/mcp/my-logs/route.ts
import { connection } from 'next/server';
import { auth } from '@/auth';
import { queryLogger } from '@/lib/mcp/query-logger';

export async function GET(req: Request) {
  await connection();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
    const logs = await queryLogger.getQueryHistory(session.user.id, { limit });

    return Response.json({ logs, totalCount: logs.length });

  } catch (error) {
    console.error('Error fetching my logs:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}