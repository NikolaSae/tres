// app/api/chat/context/route.ts

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { InternalMcpServer } from '@/lib/mcp/internal-server';
import { db } from '@/lib/db';

const mcpServer = new InternalMcpServer();

/**
 * GET /api/chat/context
 * Vraća kontekst korisnika: role, dostupne alate, recent tools
 */
export async function GET(req: NextRequest) {
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

    // Dobij sve dostupne alate za ovu ulogu
    const tools = mcpServer.getToolsForRole(userRole);
    const availableTools = tools.map(t => t.name);

    // Dobij nedavno korišćene alate iz baze
    const recentQueries = await db.queryLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { toolName: true }
    });

    // Ekstrakcija unique tool names
    const recentTools = [...new Set(recentQueries.map(q => q.toolName))].slice(0, 10);

    // Dodatne informacije o korisniku
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