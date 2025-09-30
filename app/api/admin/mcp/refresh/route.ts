// app/api/admin/mcp/refresh/route.ts
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Trigger revalidation of dashboard data
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/aidash');

    // Fetch fresh data
    const [statsRes, healthRes, toolsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/mcp/stats`, {
        cache: 'no-store'
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/mcp/system-health`, {
        cache: 'no-store'
      }),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/mcp/tools-usage`, {
        cache: 'no-store'
      })
    ]);

    const [stats, health, toolsUsage] = await Promise.all([
      statsRes.json(),
      healthRes.json(),
      toolsRes.json()
    ]);

    return Response.json({ stats, health, toolsUsage });
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    return Response.json({ error: 'Refresh failed' }, { status: 500 });
  }
}