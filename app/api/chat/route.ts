// app/api/chat/route.ts - Potpuno ažurirana verzija sa boljim AI odgovorima

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { InternalMcpServer } from '@/lib/mcp/internal-server';
import { AIContextBuilder } from '@/lib/mcp/ai-context-builder';
import type { McpContext } from '@/lib/mcp/types';
import { db } from '@/lib/db';

const mcpServer = new InternalMcpServer();
const pendingActions: Record<string, { toolName: string, params: any }> = {};

export async function POST(req: NextRequest) {
  try {
    console.log('🔥 API Chat called');
    
    const body = await req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const session = await auth();
    console.log('👤 Session:', session?.user);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const context: McpContext = {
      userId: session.user.id,
      userRole: session.user.role || 'USER'
    };

    console.log('📨 Chat request:', { message, context });

    // Dobij recent tools iz baze
    const recentQueries = await db.queryLog.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { toolName: true }
    });
    const recentTools = [...new Set(recentQueries.map(q => q.toolName))];

    // Koristi AI ako je dostupan API key (smanjena granica na 2 karaktera)
    const useAI = process.env.OPENROUTER_API_KEY && message.trim().length >= 2;
    
    console.log('🤖 AI Decision:', { 
      useAI, 
      hasApiKey: !!process.env.OPENROUTER_API_KEY,
      messageLength: message.length 
    });
    
    const result = useAI 
      ? await handleAIQuery(message, context, recentTools, conversationHistory)
      : await handleQuery(message, context);

    return NextResponse.json({ 
      response: result.response,
      timestamp: new Date().toISOString(),
      toolsUsed: result.toolsUsed || [],
      data: result.data || null
    });

  } catch (error: any) {
    console.error('❌ Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tools = mcpServer.getToolsForRole(session.user.role || 'USER');
    
    return NextResponse.json({
      status: 'OK',
      userRole: session.user.role,
      toolsCount: tools.length,
      tools: tools.map(t => ({
        name: t.name,
        category: t.category,
        description: t.description
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ POBOLJŠANA AI FUNKCIJA
async function handleAIQuery(
  query: string, 
  context: McpContext,
  recentTools: string[],
  conversationHistory: any[]
): Promise<{ response: string; toolsUsed?: string[]; data?: any }> {
  const userId = context.userId;

  // 1️⃣ Provera potvrde prethodne akcije
  if (query.trim().toLowerCase() === 'potvrdjujem' && pendingActions[userId]) {
    const { toolName, params } = pendingActions[userId];
    delete pendingActions[userId];

    try {
      const result = await mcpServer.executeTool(toolName, params, context);
      
      if (!result.success) {
        return {
          response: `❌ Greška pri izvršavanju: ${result.error}`,
          toolsUsed: [toolName],
          data: null
        };
      }
      
      return {
        response: formatToolResponse(toolName, result),
        toolsUsed: [toolName],
        data: result.data
      };
    } catch (error: any) {
      console.error('Tool execution error:', error);
      return {
        response: `❌ Greška pri izvršavanju alata: ${error.message || error}`,
        toolsUsed: [toolName],
        data: null
      };
    }
  }

  // 2️⃣ Generiši AI prompt sa AI Context Builder
  try {
    const tools = mcpServer.getToolsForRole(context.userRole);
    
    // Koristi AIContextBuilder
    const basePrompt = AIContextBuilder.buildSystemPrompt(tools, context.userRole, context);
    const hints = AIContextBuilder.generateContextualHints(recentTools, context.userRole);

    const systemPrompt = `${basePrompt}${hints}

---

**KRITIČNA PRAVILA:**

1. **Tool Execution Format:**
   \`\`\`
   TOOL_CALL: tool_name
   PARAMS: {"param1": "value1", "param2": "value2"}
   \`\`\`

2. **Za READ operacije (get_*):**
   - Izvršavaj ih odmah bez potvrde
   - Objasni šta ćeš uraditi PRE tool call-a

3. **Za WRITE operacije (create_*, update_*, delete_*):**
   - UVEK traži potvrdu
   - Objasni tačno šta će se desiti
   - Napiši: "Odgovori sa 'potvrdjujem' za izvršenje"

4. **Odgovori na srpskom jeziku**

5. **Kada nemaš dovoljno informacija:**
   - Pitaj korisnika za dodatne detalje
   - Predloži šta bi moglo pomoći

6. **Budi koncizan ali informativan**

**Dostupni alati:**
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

**Korisnikov upit:** ${query}`;

    // Priprema conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: query }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'MCP Contract Manager'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return handleQuery(query, context); // fallback
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Nema odgovora';

    // 3️⃣ Parse AI response za tool calls
    const toolMatch = aiResponse.match(/TOOL_CALL:\s*(\w+)\s*\n?\s*PARAMS:\s*(\{[^}]+\})/is);
    
    if (toolMatch) {
      const toolName = toolMatch[1].trim();
      let params: any = {};

      try {
        params = JSON.parse(toolMatch[2]);
      } catch (e) {
        console.warn('Failed to parse tool params:', toolMatch[2]);
      }

      // Proveri da li alat postoji
      const tool = tools.find(t => t.name === toolName);
      
      if (!tool) {
        return {
          response: `❌ Alat "${toolName}" nije dostupan za vašu ulogu.`,
          toolsUsed: [],
          data: null
        };
      }

      const isWriteOperation = tool.category === 'write';

      if (isWriteOperation) {
        // WRITE - čuvaj i traži potvrdu
        pendingActions[userId] = { toolName, params };
        
        // Ukloni TOOL_CALL deo iz odgovora
        const cleanResponse = aiResponse.replace(/TOOL_CALL:[\s\S]*?PARAMS:[\s\S]*?\}/i, '').trim();
        
        return {
          response: `${cleanResponse}\n\n⚠️ **Ovo je operacija izmene podataka.**\n\nDa li želiš da izvršim ovu akciju? Odgovori sa **"potvrdjujem"**.`,
          toolsUsed: [],
          data: null
        };
      } else {
        // READ - izvršava odmah
        try {
          const result = await mcpServer.executeTool(toolName, params, context);
          
          if (!result.success) {
            return {
              response: `❌ ${result.error}`,
              toolsUsed: [toolName],
              data: null
            };
          }
          
          // Ukloni TOOL_CALL deo i dodaj rezultate
          const cleanResponse = aiResponse.replace(/TOOL_CALL:[\s\S]*?PARAMS:[\s\S]*?\}/i, '').trim();
          const formattedResult = formatToolResponse(toolName, result);
          
          return {
            response: cleanResponse ? `${cleanResponse}\n\n${formattedResult}` : formattedResult,
            toolsUsed: [toolName],
            data: result.data
          };
        } catch (error: any) {
          console.error('Tool execution error:', error);
          return {
            response: `❌ Greška: ${error.message}`,
            toolsUsed: [toolName],
            data: null
          };
        }
      }
    }

    // 4️⃣ Ako AI ne poziva alat, vrati njegov odgovor
    return {
      response: aiResponse,
      toolsUsed: [],
      data: null
    };

  } catch (error: any) {
    console.error('AI Query error:', error);
    return handleQuery(query, context); // fallback
  }
}

// ✅ FALLBACK funkcija - keyword-based (ostaje ista)
async function handleQuery(
  query: string, 
  context: McpContext
): Promise<{ response: string; toolsUsed?: string[]; data?: any }> {
  const lowerQuery = query.toLowerCase();

  // Help
  if (lowerQuery.includes('koje alate') || lowerQuery.includes('help')) {
    return {
      response: formatAvailableTools(context.userRole),
      toolsUsed: [],
      data: null
    };
  }

  // Contracts
  if (lowerQuery.includes('ugovor') || lowerQuery.includes('contract')) {
    const result = await mcpServer.executeTool('get_contracts', { limit: 10 }, context);
    return {
      response: formatToolResponse('get_contracts', result),
      toolsUsed: ['get_contracts'],
      data: result.data
    };
  }

  // Providers
  if (lowerQuery.includes('provajder') || lowerQuery.includes('provider')) {
    const result = await mcpServer.executeTool('get_providers', { limit: 10 }, context);
    return {
      response: formatToolResponse('get_providers', result),
      toolsUsed: ['get_providers'],
      data: result.data
    };
  }

  // Complaints
  if (lowerQuery.includes('žalb') || lowerQuery.includes('complaint')) {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return {
        response: '🔒 Nemate pristup žalbama.',
        toolsUsed: [],
        data: null
      };
    }
    const result = await mcpServer.executeTool('get_complaints', { limit: 10 }, context);
    return {
      response: formatToolResponse('get_complaints', result),
      toolsUsed: ['get_complaints'],
      data: result.data
    };
  }

  // Default
  return {
    response: `💬 Nisam siguran šta tražite. Pokušajte:
    
- "Koje alate imam?" - Lista dostupnih alata
- "Prikaži ugovore" - Lista ugovora
- "Prikaži provajdere" - Lista provajdera
- "Statistika" - Vaše statistike`,
    toolsUsed: [],
    data: null
  };
}

// ===================================
// FORMATTING FUNCTIONS
// ===================================

function formatAvailableTools(role: string): string {
  const tools = mcpServer.getToolsForRole(role);
  
  if (tools.length === 0) {
    return `⚠️ Nema dostupnih alata za ulogu: ${role}`;
  }

  const grouped = tools.reduce((acc, tool) => {
    const category = tool.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, typeof tools>);

  let result = `🛠️ **Dostupni alati za ${role}:**\n\n`;

  const categoryEmojis: Record<string, string> = {
    read: '📖',
    write: '✏️',
    analytics: '📊',
    system: '⚙️'
  };

  Object.entries(grouped).forEach(([category, categoryTools]) => {
    const emoji = categoryEmojis[category] || '📦';
    result += `${emoji} **${category.toUpperCase()}:**\n`;
    categoryTools.forEach(tool => {
      result += `• **${tool.name}** - ${tool.description}\n`;
    });
    result += '\n';
  });

  return result;
}

function formatToolResponse(toolName: string, result: any): string {
  if (!result.success) {
    return `❌ Greška: ${result.error || 'Nepoznata greška'}`;
  }

  const { data } = result;

  switch (toolName) {
    case 'get_contracts':
      return formatContracts(data);
    case 'get_providers':
      return formatProviders(data);
    case 'get_complaints':
      return formatComplaints(data);
    case 'search_entities':
      return formatSearchResults(data);
    case 'get_user_stats':
      return formatStats(data);
    case 'get_activity_overview':
      return formatActivityOverview(data);
    case 'get_financial_summary':
      return formatFinancialSummary(data);
    default:
      // Generic formatting
      if (data && typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length <= 5) {
          let result = '✅ **Rezultat:**\n\n';
          keys.forEach(key => {
            result += `• **${key}**: ${JSON.stringify(data[key])}\n`;
          });
          return result;
        }
      }
      return `✅ Operacija uspešna!\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  }
}

function formatContracts(data: any): string {
  if (!data.contracts?.length) return '📋 Nema ugovora.';

  let result = `📋 **Ugovori** (${data.displayed}/${data.total})\n\n`;
  
  if (data.summary) {
    result += `✅ Aktivni: ${data.summary.active} | ⏰ Istekli: ${data.summary.expired} | ⏳ Pending: ${data.summary.pending}\n\n`;
  }

  data.contracts.slice(0, 5).forEach((c: any) => {
    result += `**${c.name}**\n`;
    result += `• Status: ${c.status}\n`;
    result += `• Provajder: ${c.provider?.name || 'N/A'}\n`;
    result += `• Broj: ${c.contractNumber || 'N/A'}\n\n`;
  });

  if (data.contracts.length > 5) {
    result += `_... i još ${data.contracts.length - 5} ugovora_`;
  }

  return result;
}

function formatProviders(data: any): string {
  if (!data.providers?.length) return '🏢 Nema provajdera.';

  let result = `🏢 **Provajderi** (${data.displayed}/${data.total})\n\n`;

  data.providers.slice(0, 5).forEach((p: any) => {
    result += `**${p.name}**\n`;
    result += `• Status: ${p.isActive ? '✅ Aktivan' : '❌ Neaktivan'}\n`;
    result += `• Ugovori: ${p._count?.contracts || 0}\n`;
    result += `• Žalbe: ${p._count?.complaints || 0}\n\n`;
  });

  return result;
}

function formatComplaints(data: any): string {
  if (!data.complaints?.length) return '📝 Nema žalbi.';

  let result = `📝 **Žalbe** (${data.displayed}/${data.total})\n\n`;

  if (data.summary) {
    result += `🆕 Nove: ${data.summary.new} | ⚙️ U toku: ${data.summary.inProgress} | ✅ Rešene: ${data.summary.resolved}\n\n`;
  }

  data.complaints.slice(0, 5).forEach((c: any) => {
    result += `**${c.title}**\n`;
    result += `• Status: ${c.status}\n`;
    result += `• Prioritet: ${c.priority || 'N/A'}\n\n`;
  });

  return result;
}

function formatSearchResults(data: any): string {
  let result = `🔍 **Rezultati pretrage:**\n\n`;
  let hasResults = false;

  if (data.contracts?.length) {
    hasResults = true;
    result += `📋 **Ugovori (${data.contractsTotal}):**\n`;
    data.contracts.slice(0, 3).forEach((c: any) => {
      result += `• ${c.name} (${c.status})\n`;
    });
    result += '\n';
  }

  if (data.providers?.length) {
    hasResults = true;
    result += `🏢 **Provajderi (${data.providersTotal}):**\n`;
    data.providers.slice(0, 3).forEach((p: any) => {
      result += `• ${p.name} ${p.isActive ? '✅' : '❌'}\n`;
    });
    result += '\n';
  }

  return hasResults ? result : '🔍 Nema rezultata.';
}

function formatStats(data: any): string {
  const { period, stats } = data;
  return `📊 **Statistika - ${period}:**

📋 Kreirani ugovori: ${stats.contractsCreated}
📝 Podnesene žalbe: ${stats.complaintsSubmitted}
⚡ Ukupne aktivnosti: ${stats.activitiesCount}`;
}

function formatActivityOverview(data: any): string {
  const { period, overview } = data;
  return `📊 **Pregled - ${period}**

📋 Novi ugovori: ${overview.newContracts}
⚠️ Ugovori koji ističu: ${overview.expiringContracts}
📝 Nove žalbe: ${overview.newComplaints}
⚡ Aktivnosti: ${overview.recentActivities}`;
}

function formatFinancialSummary(data: any): string {
  const { summary } = data;
  return `💰 **Finansijski pregled:**

📋 Ukupno ugovora: ${summary.totalContracts}
💵 Revenue share: ${summary.totalRevenueShare.toFixed(2)}%
📊 Prosek: ${summary.averageRevenueShare.toFixed(2)}%`;
}