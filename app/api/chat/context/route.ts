// app/api/chat/context/route.ts
import { connection } from 'next/server';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { InternalMcpServer } from '@/lib/mcp/internal-server';
import { db } from '@/lib/db';

const mcpServer = new InternalMcpServer();

export async function GET(req: NextRequest) {
  await connection();

  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role || 'USER';

    const tools = mcpServer.getToolsForRole(userRole);
    const availableTools = tools.map(t => t.name);

    const recentQueries = await db.queryLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { toolName: true }
    });

    const recentTools = [...new Set(recentQueries.map(q => q.toolName))].slice(0, 10);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      role: userRole,
      availableTools,
      recentTools,
      user: {
        name: user?.name || 'Unknown',
        email: user?.email || '',
        isActive: user?.isActive ?? true
      },
      toolsCount: availableTools.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Context API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch context' },
      { status: 500 }
    );
  }
}