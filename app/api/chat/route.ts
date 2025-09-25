// app/api/chat/route.ts
import { auth } from '@/auth';
import { NextRequest } from 'next/server';
import { InternalMcpServer, McpContext, McpResult } from '@/lib/mcp/internal-server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Tool mapping - mapiranje query analize na stvarne InternalMcpServer tools
const TOOL_MAPPING = {
  // Query analysis tool names -> Actual InternalMcpServer tool names
  'get_contracts': 'get_contracts',
  'get_providers': 'get_providers', 
  'get_complaints': 'get_complaints',
  'search_entities': 'search_entities',
  'get_user_stats': 'get_user_stats',
  'get_activity_overview': 'get_activity_overview',
  'get_financial_summary': 'get_financial_summary',
  'get_system_health': 'get_system_health',
  'search_humanitarian_orgs': 'search_entities', // Map to search_entities for now
  'manage_user': 'manage_user'
};

// Available MCP tools from InternalMcpServer
const AVAILABLE_TOOLS = [
  'get_contracts',
  'get_providers',
  'get_complaints', 
  'search_entities',
  'get_user_stats',
  'get_activity_overview',
  'get_financial_summary',
  'get_system_health',
  'manage_user'
];

class McpChatHandler {
  private mcpServer: InternalMcpServer;

  constructor() {
    this.mcpServer = new InternalMcpServer();
    // Debug: log MCP server initialization
    console.log('MCP Server initialized:', !!this.mcpServer);
  }

  // Debug method to check MCP server status (synchronous)
  private debugMcpServer(): string {
    try {
      if (!this.mcpServer) {
        return 'ERROR: MCP Server not initialized';
      }
      
      // Check if required methods exist
      const hasExecuteTool = typeof this.mcpServer.executeTool === 'function';
      
      return `MCP Server Status:
• Server exists: ${!!this.mcpServer}
• executeTool method: ${hasExecuteTool}
• Available tools: ${AVAILABLE_TOOLS.join(', ')}`;
      
    } catch (error) {
      return `MCP Server Debug Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  async handleDatabaseQuery(query: string, context: McpContext): Promise<string> {
    try {
      const queryAnalysis = await this.analyzeQuery(query);
      
      if (!queryAnalysis.isDatabaseQuery) {
        return '';
      }

      if (queryAnalysis.context === 'debug') {
        return queryAnalysis.debugInfo || 'Debug information not available';
      }

      const actualToolName = TOOL_MAPPING[queryAnalysis.toolName as keyof typeof TOOL_MAPPING];
      
      if (!actualToolName) {
        return `Izvinjavam se, funkcionalnost "${queryAnalysis.toolName}" trenutno nije dostupna.`;
      }

      if (!this.hasPermissionForTool(actualToolName, context.userRole)) {
        return 'Nemate dozvolu za izvršavanje ove komande.';
      }

      const result = await this.executeMcpTool(actualToolName, queryAnalysis.args, context);

      if (!result.success) {
        return `Greška pri izvršavanju: ${result.error || 'Nepoznata greška'}`;
      }

      // Proslijedi originalQuery za kontekst
      return this.formatResponse(result, queryAnalysis.context, actualToolName, query);
      
    } catch (error) {
      console.error('MCP query execution failed:', error);
      return 'Izvinjavam se, došlo je do greške pri pristupu bazi podataka. Molim vas pokušajte ponovo.';
    }
  }

  // Simplified permission check based on available tools
  private hasPermissionForTool(toolName: string, userRole: string): boolean {
    // Check if tool exists in available tools
    if (!AVAILABLE_TOOLS.includes(toolName)) {
      return false;
    }
    
    // Admin has access to everything
    if (userRole === 'ADMIN') return true;
    
    // Manager has access to most tools
    if (userRole === 'MANAGER') {
      return true; // Managers can access all available tools
    }
    
    // Regular users have access to basic tools
    const userAllowedTools = ['get_active_contracts', 'search_providers', 'search_humanitarian_orgs'];
    return userAllowedTools.includes(toolName);
  }

  // Wrapper for MCP tool execution with proper error handling
  private async executeMcpTool(toolName: string, args: any, context: McpContext): Promise<McpResult> {
    try {
      // Check if MCP server and method exist
      if (!this.mcpServer || typeof this.mcpServer.executeTool !== 'function') {
        throw new Error('MCP Server not properly initialized');
      }

      const result = await this.mcpServer.executeTool(toolName, args, context);
      return result;
      
    } catch (error) {
      console.error(`MCP tool execution failed for ${toolName}:`, error);
      return {
        success: false,
        error: `Greška u izvršavanju ${toolName}: ${error instanceof Error ? error.message : 'Nepoznata greška'}`,
        data: null
      };
    }
  }

  private async analyzeQuery(query: string) {
    const lowerQuery = query.toLowerCase();
    
    // Special debug command
    if (lowerQuery.includes('debug') || lowerQuery.includes('status')) {
      const debugInfo = this.debugMcpServer();
      return {
        isDatabaseQuery: true,
        toolName: 'debug',
        args: {},
        context: 'debug',
        debugInfo
      };
    }

    // Humanitarne organizacije
    if (lowerQuery.includes('humanitarn') || lowerQuery.includes('kratki broj')) {
      return {
        isDatabaseQuery: true,
        toolName: 'search_entities',
        args: { 
          query: '',
          entities: ['humanitarian_orgs'],
          onlyWithShortNumbers: lowerQuery.includes('kratki broj')
        },
        context: 'humanitarian'
      };
    }
    
    // Contract queries - poboljšano prepoznavanje sa brojevima i pozicijama
    if (lowerQuery.includes('ugovor') || lowerQuery.includes('contract')) {
      const filters = this.extractContractFilters(query);
      const numberInfo = this.extractNumberAndPosition(query);
      
      return {
        isDatabaseQuery: true,
        toolName: 'get_contracts',
        args: {
          ...filters,
          limit: numberInfo.limit,
          offset: numberInfo.offset
        },
        context: 'contracts'
      };
    }

    // Provider queries
    if (lowerQuery.includes('provajder') || lowerQuery.includes('provider')) {
      const filters = this.extractProviderFilters(query);
      const numberInfo = this.extractNumberAndPosition(query);
      
      return {
        isDatabaseQuery: true,
        toolName: 'get_providers',
        args: {
          ...filters,
          limit: numberInfo.limit,
          offset: numberInfo.offset
        },
        context: 'providers'
      };
    }

    // Complaint queries
    if (lowerQuery.includes('žalb') || lowerQuery.includes('complaint') || lowerQuery.includes('zalb')) {
      const filters = this.extractComplaintFilters(query);
      const numberInfo = this.extractNumberAndPosition(query);
      
      return {
        isDatabaseQuery: true,
        toolName: 'get_complaints',
        args: {
          ...filters,
          limit: numberInfo.limit,
          offset: numberInfo.offset
        },
        context: 'complaints'
      };
    }

    // Statistics queries
    if (lowerQuery.includes('statistik') || lowerQuery.includes('stats') || 
        lowerQuery.includes('aktivnost') || lowerQuery.includes('pregled') ||
        lowerQuery.includes('sistem') || lowerQuery.includes('zdravlje')) {
      return {
        isDatabaseQuery: true,
        toolName: 'get_user_stats',
        args: { period: this.extractPeriod(query) },
        context: 'stats'
      };
    }

    // Search queries
    if (lowerQuery.includes('pretraži') || lowerQuery.includes('search') || lowerQuery.includes('pronađi')) {
      const numberInfo = this.extractNumberAndPosition(query);
      
      return {
        isDatabaseQuery: true,
        toolName: 'search_entities',
        args: { 
          query: this.extractSearchTerm(query),
          entities: this.extractSearchEntities(query),
          limit: numberInfo.limit,
          offset: numberInfo.offset
        },
        context: 'search'
      };
    }

    return { isDatabaseQuery: false };
  }

  private extractNumberAndPosition(query: string): { limit: number; offset: number } {
    const lowerQuery = query.toLowerCase();
    
    // Prepoznavanje pozicijskih zahteva
    const positionPatterns = [
      { pattern: /\bprv[aieo]?\s*(\d+)/, key: 'first' },
      { pattern: /\bposlednj[aieo]?\s*(\d+)/, key: 'last' },
      { pattern: /\bsledećih?\s*(\d+)/, key: 'next' },
      { pattern: /\bprethodnih?\s*(\d+)/, key: 'previous' }
    ];
    
    for (const { pattern, key } of positionPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        const count = parseInt(match[1]);
        return {
          limit: count,
          offset: key === 'last' ? -count : 0 // Za "poslednji" ćemo sortirati obrnut redosled
        };
      }
    }
    
    // Prepoznavanje osnovnih brojeva
    const numberPatterns = [
      /\b(\d+)\s*(?:ugovor|contract|provajder|provider|žalb|complaint)/,
      /(?:ugovor|contract|provajder|provider|žalb|complaint)\s*(\d+)/,
      /\bbroj\s*(\d+)/,
      /\b(\d+)\s*(?:komad|rezultat|stavk)/,
      /(?:pokaži|prikaži|daj)\s*(\d+)/
    ];
    
    for (const pattern of numberPatterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        return {
          limit: parseInt(match[1]),
          offset: 0
        };
      }
    }
    
    // Prepoznavanje ključnih reči bez brojeva
    if (lowerQuery.includes('sve') || lowerQuery.includes('all')) {
      return { limit: 100, offset: 0 };
    }
    
    if (lowerQuery.includes('nekoliko') || lowerQuery.includes('malo')) {
      return { limit: 3, offset: 0 };
    }
    
    // Default
    return { limit: 10, offset: 0 };
  }

  // Existing helper methods (keeping them but with some improvements)
  private extractContractFilters(query: string) {
    const filters: any = {};
    const lowerQuery = query.toLowerCase();
    
    // Status
    if (lowerQuery.includes('aktivan') || lowerQuery.includes('active')) {
      filters.status = 'ACTIVE';
    } else if (lowerQuery.includes('istekao') || lowerQuery.includes('expired')) {
      filters.status = 'EXPIRED';
    } else if (lowerQuery.includes('na čekanju') || lowerQuery.includes('pending')) {
      filters.status = 'PENDING';
    }
    
    // Tip
    if (lowerQuery.includes('parking') || lowerQuery.includes('parkiralište')) {
      filters.type = 'PARKING';
    } else if (lowerQuery.includes('humanitarn') || lowerQuery.includes('humanitarian')) {
      filters.type = 'HUMANITARIAN';
    } else if (lowerQuery.includes('provajder') || lowerQuery.includes('provider')) {
      filters.type = 'PROVIDER';
    }
    
    // Sortiranje za "poslednji"
    if (lowerQuery.includes('poslednj') || lowerQuery.includes('najnovij')) {
      filters.orderBy = { createdAt: 'desc' };
    } else if (lowerQuery.includes('najstar') || lowerQuery.includes('prv')) {
      filters.orderBy = { createdAt: 'asc' };
    }

    return filters;
  }

  private extractProviderFilters(query: string) {
    const filters: any = {};
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('aktivan') || lowerQuery.includes('active')) {
      filters.isActive = true;
    } else if (lowerQuery.includes('neaktivan') || lowerQuery.includes('inactive')) {
      filters.isActive = false;
    }

    // Sortiranje
    if (lowerQuery.includes('poslednj') || lowerQuery.includes('najnovij')) {
      filters.orderBy = { createdAt: 'desc' };
    } else if (lowerQuery.includes('alfabetsk') || lowerQuery.includes('abc')) {
      filters.orderBy = { name: 'asc' };
    }

    // Search term for provider name
    const searchTerm = this.extractSearchTerm(query);
    if (searchTerm && searchTerm !== query.trim()) {
      filters.name = searchTerm;
    }

    return filters;
  }

  private extractComplaintFilters(query: string) {
    const filters: any = {};
    const lowerQuery = query.toLowerCase();
    
    // Status mapping
    const statusMap = {
      'nova': 'NEW',
      'new': 'NEW',
      'u radu': 'IN_PROGRESS',
      'progress': 'IN_PROGRESS',
      'rešena': 'RESOLVED',
      'resolved': 'RESOLVED',
      'dodeljena': 'ASSIGNED',
      'assigned': 'ASSIGNED',
      'na čekanju': 'PENDING',
      'pending': 'PENDING'
    };

    for (const [key, value] of Object.entries(statusMap)) {
      if (lowerQuery.includes(key)) {
        filters.status = value;
        break;
      }
    }

    // Prioritet
    const priorityMap = {
      'visok': 1,
      'high': 1,
      'srednji': 3,
      'medium': 3,
      'nizak': 5,
      'low': 5
    };

    for (const [key, value] of Object.entries(priorityMap)) {
      if (lowerQuery.includes(key)) {
        filters.priority = value;
        break;
      }
    }

    // Sortiranje
    if (lowerQuery.includes('najnovij') || lowerQuery.includes('posledn')) {
      filters.orderBy = { createdAt: 'desc' };
    } else if (lowerQuery.includes('najstar') || lowerQuery.includes('prv')) {
      filters.orderBy = { createdAt: 'asc' };
    } else if (lowerQuery.includes('prioritet')) {
      filters.orderBy = { priority: 'asc' };
    }

    return filters;
  }

  private extractSearchTerm(query: string): string {
    // Remove common search keywords and return the actual search term
    const cleanQuery = query
      .replace(/(?:pretraži|search|pronađi|pokaži|show|daj|give|mi)/gi, '')
      .replace(/(?:ugovor|contract|provajder|provider|žalb|complaint|zalb)/gi, '')
      .trim();
    
    return cleanQuery || query.trim();
  }

  private extractSearchEntities(query: string): string[] {
    const entities = [];
    
    if (query.includes('ugovor') || query.includes('contract')) {
      entities.push('contracts');
    }
    if (query.includes('provajder') || query.includes('provider')) {
      entities.push('providers');
    }
    if (query.includes('žalb') || query.includes('complaint')) {
      entities.push('complaints');
    }

    return entities.length > 0 ? entities : ['contracts', 'providers'];
  }

  private extractPeriod(query: string): string {
    const periodMap = {
      'danas': 'today',
      'today': 'today',
      'nedelj': 'week', 
      'week': 'week',
      'mesec': 'month',
      'month': 'month',
      'kvartal': 'quarter',
      'quarter': 'quarter',
      'godin': 'year',
      'year': 'year'
    };

    for (const [key, value] of Object.entries(periodMap)) {
      if (query.includes(key)) {
        return value;
      }
    }
    
    return 'month'; // default
  }

  private formatResponse(result: McpResult, context: string, toolName: string, originalQuery?: string): string {
    if (!result.success || !result.data) {
      return 'Podaci nisu pronađeni ili je došlo do greške pri pristupu bazi podataka.';
    }

    const data = result.data;
    const lowerQuery = originalQuery?.toLowerCase() || '';

    switch (toolName) {
      case 'get_contracts':
        return this.formatContracts(data, lowerQuery);
      case 'get_providers':
        return this.formatProviders(data, lowerQuery);
      case 'get_complaints':
        return this.formatComplaints(data, lowerQuery);
      case 'search_entities':
        return this.formatSearchResults(data, lowerQuery);
      case 'get_user_stats':
        return this.formatUserStats(data);
      case 'get_activity_overview':
        return this.formatActivityOverview(data);
      case 'get_financial_summary':
        return this.formatFinancialSummary(data);
      case 'get_system_health':
        return this.formatSystemHealth(data);
      case 'manage_user':
        return this.formatUserManagement(data);
      default:
        return this.formatGenericResponse(data, context);
    }
  }

  private formatContracts(data: any, query: string = ''): string {
    if (!data.contracts || data.contracts.length === 0) {
      return 'Nisu pronađeni ugovori koji odgovaraju vašim kriterijumima.';
    }
    
    const contracts = data.contracts;
    const displayCount = contracts.length;
    
    const contractList = contracts.map((contract: any, index: number) => {
      const entityName = contract.provider?.name || 
                        contract.humanitarianOrg?.name || 
                        contract.parkingService?.name || 
                        'N/A';
      
      const position = index + 1;
      const positionText = query.includes('prv') ? `${position}. ` : '• ';
      
      return `${positionText}${contract.name || contract.contractNumber}\n  Status: ${contract.status}\n  Entitet: ${entityName}\n  Procenat: ${contract.revenuePercentage || 0}%`;
    }).join('\n\n');

    // Kontekstualni naslov
    let title = 'Pronađeni ugovori';
    if (query.includes('prv')) {
      const number = query.match(/\d+/)?.[0];
      title = number ? `Prvih ${number} ugovor${parseInt(number) === 1 ? '' : 'a'}` : 'Prvi ugovori';
    } else if (query.includes('poslednj')) {
      const number = query.match(/\d+/)?.[0];
      title = number ? `Poslednjih ${number} ugovor${parseInt(number) === 1 ? '' : 'a'}` : 'Poslednji ugovori';
    } else if (query.includes('aktivan')) {
      title = 'Aktivni ugovori';
    }

    const summaryText = data.summary ? 
      `\n\nSažetak: ${data.summary.active} aktivnih, ${data.summary.expired} isteklih, ${data.summary.pending} na čekanju` : '';

    const totalInfo = data.total && data.total > displayCount ? 
      `\n\n(Prikazano ${displayCount} od ukupno ${data.total} ugovora)` : '';

    return `${title}:\n\n${contractList}${summaryText}${totalInfo}`;
  }

  private formatProviders(data: any, query: string = ''): string {
    if (!data.providers || data.providers.length === 0) {
      return 'Nisu pronađeni provajderi.';
    }

    const providers = Array.isArray(data.providers) ? data.providers : [data.providers];
    const displayCount = providers.length;
    
    const providerList = providers.map((provider: any, index: number) => {
      const position = index + 1;
      const positionText = query.includes('prv') ? `${position}. ` : '• ';
      
      return `${positionText}${provider.name}\n  Status: ${provider.isActive ? 'Aktivan' : 'Neaktivan'}\n  Email: ${provider.email || 'N/A'}`;
    }).join('\n\n');

    let title = 'Pronađeni provajderi';
    if (query.includes('prv')) {
      const number = query.match(/\d+/)?.[0];
      title = number ? `Prvih ${number} provajder${parseInt(number) === 1 ? '' : 'a'}` : 'Prvi provajderi';
    }

    const totalInfo = data.total && data.total > displayCount ? 
      `\n\n(Prikazano ${displayCount} od ukupno ${data.total} provajdera)` : '';

    return `${title}:\n\n${providerList}${totalInfo}`;
  }

  private formatComplaints(data: any): string {
    if (!data.complaints || data.complaints.length === 0) {
      return 'Nisu pronađene žalbe koje odgovaraju vašim kriterijumima.';
    }
    
    const complaintList = data.complaints.slice(0, 5).map((complaint: any) => {
      const financialImpact = complaint.financialImpact ? 
        ` (${complaint.financialImpact} RSD)` : '';
      const assignedTo = complaint.assignedAgent ? 
        `\n  Dodeljena: ${complaint.assignedAgent.name}` : '\n  Nedodeljena';
      
      return `• ${complaint.title} - ${complaint.status} (P${complaint.priority})${financialImpact}${assignedTo}\n  Podnosilac: ${complaint.submittedBy.name}`;
    }).join('\n\n');

    const summaryText = data.summary ? 
      `\n\nSažetak: ${data.summary.new} novih, ${data.summary.inProgress} u radu, ${data.summary.resolved} rešenih` : '';

    const total = data.complaints.length > 5 ? 
      `\n\n(Prikazano 5 od ukupno ${data.complaints.length} žalbi)` : '';

    return `Pronađene žalbe:\n\n${complaintList}${summaryText}${total}`;
  }

  private formatActivityOverview(data: any): string {
    const { period, overview } = data;
    const periodText = period === 'today' ? 'danas' : 
                      period === 'week' ? 'ova nedelja' : 'ovaj mesec';

    return `Pregled aktivnosti za ${periodText}:
• Novi ugovori: ${overview.newContracts}
• Ugovori koji ističu uskoro: ${overview.expiringContracts}
• Nove žalbe: ${overview.newComplaints}
• Aktivna obnavljanja: ${overview.activeRenewals}
• Ukupne aktivnosti: ${overview.recentActivities}`;
  }

  private formatUserStats(data: any): string {
    const { period, stats } = data;
    const periodText = period === 'week' ? 'poslednja nedelja' : 
                      period === 'month' ? 'poslednji mesec' : 'poslednja godina';

    return `Vaša statistika za ${periodText}:
• Kreiran${stats.contractsCreated === 1 ? '' : 'o'} ugovor${stats.contractsCreated === 1 ? '' : 'a'}: ${stats.contractsCreated}
• Podnet${stats.complaintsSubmitted === 1 ? 'a' : 'o'} žalb${stats.complaintsSubmitted === 1 ? 'a' : 'i'}: ${stats.complaintsSubmitted}
• Ukupnih aktivnosti: ${stats.activitiesCount}`;
  }

  private formatFinancialSummary(data: any): string {
    const { period, financial } = data;
    const periodText = period === 'month' ? 'mesec' : 
                      period === 'quarter' ? 'kvartal' : 'godinu';

    return `Finansijski pregled za ${periodText}:
• Aktivni ugovori: ${financial.activeContracts}
• Prosečan procenat prihoda: ${financial.averageRevenuePercentage.toFixed(2)}%
• Tip ugovora: ${financial.contractType === 'all' ? 'svi' : financial.contractType}`;
  }

  private formatSystemHealth(data: any): string {
    const { system } = data;

    return `Zdravlje sistema:
• Korisnici: ${system.users.active}/${system.users.total} aktivnih
• Ugovori: ${system.contracts.active}/${system.contracts.total} aktivnih
• Žalbe na čekanju: ${system.complaints.pending}`;
  }

  private formatUserManagement(data: any): string {
    if (data.message) {
      return data.message;
    }

    if (data.user) {
      const user = data.user;
      return `Informacije o korisniku:
• Ime: ${user.name || 'N/A'}
• Email: ${user.email}
• Uloga: ${user.role}
• Status: ${user.isActive ? 'Aktivan' : 'Neaktivan'}
• Kreiran: ${new Date(user.createdAt).toLocaleDateString('sr-RS')}`;
    }

    return 'Operacija je uspešno izvršena.';
  }

  private formatGenericResponse(data: any, context: string): string {
    if (typeof data === 'string') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return `Pronađeno ${data.length} rezultata.`;
    }
    
    return 'Podaci su uspešno pronađeni.';
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Invalid messages format' }, { status: 400 });
    }
    
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage || !lastMessage.content) {
      return Response.json({ error: 'Invalid message content' }, { status: 400 });
    }
    
    const context: McpContext = {
      userId: session.user.id!,
      userRole: session.user.role || 'USER'
    };
    
    const mcpHandler = new McpChatHandler();
    const dbResponse = await mcpHandler.handleDatabaseQuery(lastMessage.content, context);
    
    let finalResponse = '';
    
    if (dbResponse) {
      // Database query was handled successfully
      finalResponse = `${dbResponse}\n\nDa li želite dodatne informacije ili imate drugo pitanje?`;
    } else {
      // Use OpenRouter for general chat
      try {
        if (!process.env.OPENROUTER_API_KEY) {
          finalResponse = 'Izvinjavam se, trenutno ne mogu da pristupim vanjskim AI uslugama. Pokušajte sa specifičnim upitima o ugovorima, provajderima ili žalbama.';
        } else {
          const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'X-Title': 'Contract Management Chat'
            },
            body: JSON.stringify({
              model: 'deepseek/deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: `Ti si AI asistent za sistem upravljanja ugovorima. Možeš da odgovoriš na opšta pitanja, ali za specifične upite o bazi podataka koristi komande kao što su:
                  - "Pokaži aktivne ugovore"
                  - "Pretraži provajdere"
                  - "Pokaži žalbe na čekanju"
                  - "Sistemske statistike"
                  - "Humanitarne organizacije sa kratkim brojevima"
                  
                  Korisnikov kontekst: Uloga ${context.userRole}, ID ${context.userId}
                  
                  Odgovaraj kratko i jasno na srpskom jeziku.`
                },
                ...messages.slice(-5) // Samo poslednjih 5 poruka za kontekst
              ],
              stream: false,
              max_tokens: 500,
              temperature: 0.7
            })
          });

          if (openrouterResponse.ok) {
            const data = await openrouterResponse.json();
            finalResponse = data.choices[0].message.content;
          } else {
            console.error('OpenRouter API error:', await openrouterResponse.text());
            finalResponse = 'Trenutno ne mogu da odgovorim na opšta pitanja. Pokušajte sa specifičnim upitima o ugovorima, provajderima ili žalbama.';
          }
        }
      } catch (openrouterError) {
        console.error('OpenRouter request failed:', openrouterError);
        finalResponse = 'Izvinjavam se, trenutno ne mogu da pristupim vanjskim AI uslugama. Možete pokušati sa specifičnim upitima o sistemu.';
      }
    }

    return Response.json({
      message: {
        role: 'assistant',
        content: finalResponse
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({
      message: {
        role: 'assistant',
        content: 'Izvinjavam se, došlo je do greške u komunikaciji. Molim vas pokušajte ponovo.'
      }
    }, { status: 500 });
  }
}