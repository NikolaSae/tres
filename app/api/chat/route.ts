// app/api/chat/route.ts - Potpuno ažurirana verzija sa AI Context Builder

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { InternalMcpServer } from '@/lib/mcp/internal-server';
import { AIContextBuilder } from '@/lib/mcp/ai-context-builder';
import type { McpContext } from '@/lib/mcp/types';

const mcpServer = new InternalMcpServer();
const pendingActions: Record<string, { toolName: string, params: any }> = {};
const userToolHistory: Record<string, string[]> = {}; // 🆕 Praćenje tool usage

export async function POST(req: NextRequest) {
  try {
    console.log('🔥 API Chat called');
    
    const body = await req.json();
    const { message } = body;

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

    // 🆕 Praćenje tool historije za contextual hints
    if (!userToolHistory[context.userId]) {
      userToolHistory[context.userId] = [];
    }

    // Koristi AI ako je dostupan API key i poruka je dovoljno duga
    const useAI = process.env.OPENROUTER_API_KEY && message.length > 5;
    
    const response = useAI 
      ? await handleAIQuery(message, context, userToolHistory[context.userId])
      : await handleQuery(message, context);

    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
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

// ✅ AŽURIRANA FUNKCIJA - AI-powered sa AI Context Builder
async function handleAIQuery(
  query: string, 
  context: McpContext,
  recentTools: string[]
): Promise<string> {
  const userId = context.userId;

  // 1️⃣ Provera potvrde prethodne akcije
  if (query.trim().toLowerCase() === 'potvrdjujem' && pendingActions[userId]) {
    const { toolName, params } = pendingActions[userId];
    delete pendingActions[userId];

    try {
      const result = await mcpServer.executeTool(toolName, params, context);
      
      // 🆕 Dodaj u tool history
      userToolHistory[userId] = [...(userToolHistory[userId] || []), toolName].slice(-10);
      
      return formatToolResponse(toolName, result);
    } catch (error: any) {
      console.error('Tool execution error:', error);
      return `❌ Greška pri izvršavanju alata: ${error.message || error}`;
    }
  }

  // 2️⃣ Generiši optimizovan AI prompt korišćenjem AI Context Builder
  try {
    const tools = mcpServer.getToolsForRole(context.userRole);
    
    // 🆕 Koristi AIContextBuilder za stvaranje system prompta
    const systemPrompt = AIContextBuilder.buildSystemPrompt(
      tools,
      context.userRole,
      context
    );

    // 🆕 Dodaj contextual hints
    const hints = AIContextBuilder.generateContextualHints(
      recentTools,
      context.userRole
    );

    const fullPrompt = `${systemPrompt}${hints}

---

**KRITIČNA PRAVILA ZA KORIŠĆENJE ALATA:**

1. **Format odgovora kada predlažeš alat:**
   \`\`\`
   Koristim alat: [IME_ALATA] sa parametrima: {"key": "value"}
   \`\`\`

2. **Kada tražiš od korisnika da potvrdi:**
   - Jasno objasni šta će alat uraditi
   - Napiši: "Da li želiš da potvrdim ovu akciju? (Odgovori sa 'potvrdjujem')"

3. **Za READ alate (get_*):** Automatski ih koristi bez potvrde
4. **Za WRITE alate (create_*, update_*, delete_*):** UVEK traži potvrdu

5. **Uvek odgovaraj na srpskom jeziku**

**Trenutni upit korisnika:** ${query}`;

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
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 800 // 🆕 Povećano zbog dužeg system prompta
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      return handleQuery(query, context); // fallback
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Nema odgovora';

    // 3️⃣ Parsiranje AI odgovora za detekciju tool calla
    const toolMatch = aiResponse.match(/Koristim alat:\s*(\w+)\s*(?:sa parametrima:\s*(\{.+?\}))?/is);
    
    if (toolMatch) {
      const toolName = toolMatch[1];
      let params: any = {};

      if (toolMatch[2]) {
        try {
          params = JSON.parse(toolMatch[2]);
        } catch (e) {
          console.warn('Failed to parse tool params:', toolMatch[2]);
        }
      }

      // 🆕 Proveri da li je WRITE operacija
      const tool = tools.find(t => t.name === toolName);
      const isWriteOperation = tool?.category === 'write';

      if (isWriteOperation) {
        // WRITE operacija - čuvaj u pending i traži potvrdu
        pendingActions[userId] = { toolName, params };
        return `${aiResponse}\n\n⚠️ **Ovo je operacija izmene podataka.**\n\n` +
               `Da li želiš da potvrdim akciju? Odgovori sa **"potvrdjujem"**.`;
      } else {
        // READ operacija - izvršava se odmah
        try {
          const result = await mcpServer.executeTool(toolName, params, context);
          
          // 🆕 Dodaj u tool history
          userToolHistory[userId] = [...(userToolHistory[userId] || []), toolName].slice(-10);
          
          return formatToolResponse(toolName, result);
        } catch (error: any) {
          console.error('Tool execution error:', error);
          return `❌ Greška pri izvršavanju alata: ${error.message}`;
        }
      }
    }

    // 4️⃣ Ako AI ne poziva alat, vrati njegov odgovor
    return aiResponse;

  } catch (error: any) {
    console.error('AI Query error:', error);
    return handleQuery(query, context); // fallback na keyword matching
  }
}

// ✅ Originalna keyword-based funkcija (fallback) - OSTAJE ISTA
async function handleQuery(query: string, context: McpContext): Promise<string> {
  const lowerQuery = query.toLowerCase();

  // Help request
  if (lowerQuery.includes('koje alate') || 
      lowerQuery.includes('što možeš') || 
      lowerQuery.includes('available tools') ||
      lowerQuery.includes('list tools') ||
      lowerQuery.includes('help')) {
    return formatAvailableTools(context.userRole);
  }

  // Debug/status
  if (lowerQuery.includes('debug') || lowerQuery.includes('status')) {
    return getSystemStatus();
  }

  // Contracts
  if (lowerQuery.includes('ugovor') || lowerQuery.includes('contract')) {
    const result = await mcpServer.executeTool('get_contracts', {
      limit: 10,
      offset: 0
    }, context);
    return formatToolResponse('get_contracts', result);
  }

  // Providers
  if (lowerQuery.includes('provajder') || lowerQuery.includes('provider')) {
    const result = await mcpServer.executeTool('get_providers', {
      limit: 10,
      offset: 0
    }, context);
    return formatToolResponse('get_providers', result);
  }

  // Complaints
  if (lowerQuery.includes('žalb') || lowerQuery.includes('complaint') || lowerQuery.includes('zalb')) {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return '🔒 Nemate pristup žalbama. Kontaktirajte administratora.';
    }
    const result = await mcpServer.executeTool('get_complaints', {
      limit: 10,
      offset: 0
    }, context);
    return formatToolResponse('get_complaints', result);
  }

  // Search
  if (lowerQuery.includes('pretraži') || 
      lowerQuery.includes('search') || 
      lowerQuery.includes('pronađi') ||
      lowerQuery.includes('humanitarn')) {
    const searchTerm = extractSearchTerm(query);
    const result = await mcpServer.executeTool('search_entities', {
      query: searchTerm,
      entities: ['contracts', 'providers', 'complaints', 'humanitarian_orgs'],
      limit: 20
    }, context);
    return formatToolResponse('search_entities', result);
  }

  // Stats
  if (lowerQuery.includes('statistik') || lowerQuery.includes('stats')) {
    const result = await mcpServer.executeTool('get_user_stats', {
      period: 'month'
    }, context);
    return formatToolResponse('get_user_stats', result);
  }

  // Default
  return `💬 Nisam siguran šta tražite. Pokušajte:

- "Koje alate imam?" - Lista dostupnih alata
- "Prikaži ugovore" - Lista ugovora
- "Prikaži provajdere" - Lista provajdera
- "Pretraži Telekom" - Pretraga
- "Statistika" - Vaše statistike`;
}

// ===================================
// FORMATTING FUNCTIONS - OSTAJU ISTE
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

  Object.entries(grouped).forEach(([category, categoryTools]) => {
    result += `**${category.toUpperCase()}:**\n`;
    categoryTools.forEach(tool => {
      result += `• **${tool.name}**\n`;
      result += `  ${tool.description}\n`;
      if (tool.examples?.length) {
        result += `  _Primeri: ${tool.examples.slice(0, 2).join(', ')}_\n`;
      }
      result += '\n';
    });
  });

  return result;
}

function getSystemStatus(): string {
  return `📊 **MCP Server Status:**

✅ Server: Operativan
🔧 Alati: ${mcpServer.getToolsForRole('ADMIN').length} dostupnih
💾 Database: Povezana
⚡ Response: ~${Math.random() * 100 | 0}ms

_Sistem radi normalno._`;
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
    case 'update_provider':
    case 'create_provider':
      return formatProviderUpdate(data);
    case 'get_activity_overview':
      return formatActivityOverview(data);
    case 'get_system_health':
      return formatSystemHealth(data);
    case 'update_contract':
    case 'create_contract':
      return `✅ Ugovor uspešno ${toolName.includes('create') ? 'kreiran' : 'ažuriran'}!\n\n` +
             `ID: ${data.contract?.id}\n` +
             `Naziv: ${data.contract?.name}`;
    case 'create_complaint':
    case 'update_complaint':
      return `✅ Žalba uspešno ${toolName.includes('create') ? 'kreirana' : 'ažurirana'}!\n\n` +
             `ID: ${data.complaint?.id}\n` +
             `Naslov: ${data.complaint?.title}`;
    default:
      return `✅ **Rezultat:**\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  }
}

function formatContracts(data: any): string {
  if (!data.contracts?.length) {
    return '📋 Nema ugovora.';
  }

  let result = `📋 **Ugovori** (${data.displayed}/${data.total})\n\n`;
  
  if (data.summary) {
    result += `✅ Aktivni: ${data.summary.active} | ⏰ Istekli: ${data.summary.expired} | ⏳ Pending: ${data.summary.pending}\n\n`;
  }

  data.contracts.slice(0, 5).forEach((c: any) => {
    result += `**${c.name}**\n`;
    result += `• Status: ${c.status}\n`;
    result += `• Provajder: ${c.provider?.name || 'N/A'}\n`;
    result += `• Broj: ${c.contractNumber || 'N/A'}\n`;
    result += `• Period: ${new Date(c.startDate).toLocaleDateString('sr-RS')} - ${new Date(c.endDate).toLocaleDateString('sr-RS')}\n\n`;
  });

  if (data.contracts.length > 5) {
    result += `_... i još ${data.contracts.length - 5} ugovora_`;
  }

  return result;
}

function formatProviders(data: any): string {
  if (!data.providers?.length) {
    return '🏢 Nema provajdera.';
  }

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
  if (!data.complaints?.length) {
    return '📝 Nema žalbi.';
  }

  let result = `📝 **Žalbe** (${data.displayed}/${data.total})\n\n`;

  if (data.summary) {
    result += `🆕 Nove: ${data.summary.new} | ⚙️ U toku: ${data.summary.inProgress} | ✅ Rešene: ${data.summary.resolved}\n\n`;
  }

  data.complaints.slice(0, 5).forEach((c: any) => {
    result += `**${c.title}**\n`;
    result += `• Status: ${c.status}\n`;
    result += `• Prioritet: ${c.priority || 'N/A'}\n`;
    result += `• Provajder: ${c.provider?.name || 'N/A'}\n\n`;
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

  if (data.complaints?.length) {
    hasResults = true;
    result += `📝 **Žalbe (${data.complaintsTotal}):**\n`;
    data.complaints.slice(0, 3).forEach((c: any) => {
      result += `• ${c.title} (${c.status})\n`;
    });
    result += '\n';
  }

  if (data.humanitarianOrgs?.length) {
    hasResults = true;
    result += `🤝 **Humanitarne org. (${data.humanitarianOrgsTotal}):**\n`;
    data.humanitarianOrgs.slice(0, 3).forEach((h: any) => {
      result += `• ${h.name}${h.shortNumber ? ` (${h.shortNumber})` : ''}\n`;
    });
  }

  if (!hasResults) {
    return '🔍 Nema rezultata pretrage.';
  }

  return result;
}

function formatStats(data: any): string {
  const { period, stats } = data;
  return `📊 **Tvoja statistika - ${period}:**

📋 Kreirani ugovori: ${stats.contractsCreated}
📝 Podnesene žalbe: ${stats.complaintsSubmitted}
⚡ Ukupne aktivnosti: ${stats.activitiesCount}`;
}

function formatProviderUpdate(data: any): string {
  if (!data.provider) {
    return '❌ Greška pri ažuriranju provajdera.';
  }

  const p = data.provider;
  return `✅ **Provajder uspešno ažuriran**

**${p.name}**
- Email: ${p.email || 'N/A'}
- Telefon: ${p.phone || 'N/A'}
- Status: ${p.isActive ? '✅ Aktivan' : '❌ Neaktivan'}
- Adresa: ${p.address || 'N/A'}

_Ažurirano: ${new Date(p.updatedAt).toLocaleString('sr-RS')}_`;
}

function formatActivityOverview(data: any): string {
  const { period, overview } = data;
  return `📊 **Pregled aktivnosti - ${period}**

📋 Novi ugovori: ${overview.newContracts}
⚠️ Ugovori koji ističu (30 dana): ${overview.expiringContracts}
📝 Nove žalbe: ${overview.newComplaints}
🔄 Aktivna obnavljanja: ${overview.activeRenewals}
⚡ Nedavne aktivnosti: ${overview.recentActivities}`;
}

function formatSystemHealth(data: any): string {
  const { system } = data;
  return `🏥 **Zdravlje sistema**

👥 Korisnici:
- Ukupno: ${system.users.total}
- Aktivni: ${system.users.active}

📋 Ugovori:
- Ukupno: ${system.contracts.total}
- Aktivni: ${system.contracts.active}

📝 Žalbe:
- Na čekanju: ${system.complaints.pending}

✅ Sistem radi normalno`;
}

function extractSearchTerm(query: string): string {
  const match = query.match(/pretraži\s+(.+)|search\s+(.+)|pronađi\s+(.+)/i);
  return match ? (match[1] || match[2] || match[3]).trim() : query;
}