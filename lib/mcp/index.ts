// lib/mcp/index.ts
import { McpTool, McpResult, McpContext, ToolMapping } from './types';

/**
 * Internal MCP Server
 * Centralno mesto za izvršenje MCP alata
 */
export class InternalMcpServer {
  public tools: McpTool[];

  constructor() {
    // Definisanje svih alata koje MCP može da izvrši
    this.tools = [
      { name: 'get_contracts', description: 'Fetch contracts from DB', inputSchema: {} },
      { name: 'get_providers', description: 'Fetch providers', inputSchema: {} },
      { name: 'get_complaints', description: 'Fetch complaints', inputSchema: {} },
      { name: 'search_entities', description: 'Search entities', inputSchema: {} },
      { name: 'get_user_stats', description: 'Get user statistics', inputSchema: {} },
      { name: 'get_activity_overview', description: 'Get activity overview', inputSchema: {} },
      { name: 'get_financial_summary', description: 'Get financial summary', inputSchema: {} },
      { name: 'get_system_health', description: 'Check system health', inputSchema: {} },
      { name: 'manage_user', description: 'Manage user accounts', inputSchema: {} },
      // Write tools
      { name: 'create_complaint', description: 'Create a new complaint', inputSchema: {} },
      { name: 'update_complaint', description: 'Update an existing complaint', inputSchema: {} },
      { name: 'add_complaint_comment', description: 'Add a comment to a complaint', inputSchema: {} },
      { name: 'create_contract', description: 'Create a new contract', inputSchema: {} },
      { name: 'update_contract', description: 'Update an existing contract', inputSchema: {} },
      { name: 'delete_contract', description: 'Delete a contract', inputSchema: {} },
      { name: 'bulk_update_contracts', description: 'Bulk update contracts', inputSchema: {} },
      { name: 'create_provider', description: 'Create a new provider', inputSchema: {} },
      { name: 'update_provider', description: 'Update provider data', inputSchema: {} },
      { name: 'create_humanitarian_org', description: 'Create a humanitarian organization', inputSchema: {} },
    ];
  }

  /**
   * Vraća listu alata dostupnih za određenu ulogu
   */
  getToolsForRole(role: string): McpTool[] {
    switch (role) {
      case 'ADMIN':
        return this.tools;
      case 'MANAGER':
        return this.tools.filter(t => !['manage_user'].includes(t.name));
      case 'AGENT':
        return this.tools.filter(t => ['get_contracts', 'get_complaints', 'get_providers'].includes(t.name));
      default:
        return this.tools.filter(t => ['get_contracts', 'get_providers'].includes(t.name));
    }
  }

  /**
   * Izvršava određeni alat sa argumentima i korisničkim kontekstom
   */
  async executeTool(toolName: string, args: any, context: McpContext): Promise<McpResult> {
    const start = Date.now();
    try {
      const tool = this.tools.find(t => t.name === toolName);
      if (!tool) {
        return { success: false, error: `Tool "${toolName}" not found` };
      }

      // Ovo je mesto gde ide stvarna logika za DB ili druge operacije
      // Za sada vraćamo dummy podatke
      const dummyData = { total: 0, results: [] };

      const result: McpResult = {
        success: true,
        data: dummyData,
        metadata: {
          executionTime: Date.now() - start,
          queryInfo: { toolName, args, userId: context.userId },
        },
      };

      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown MCP execution error' };
    }
  }
}

/**
 * Helper za mapiranje query → alat
 */
export const TOOL_MAPPING: ToolMapping = {
  get_contracts: 'get_contracts',
  get_providers: 'get_providers',
  get_complaints: 'get_complaints',
  search_entities: 'search_entities',
  get_user_stats: 'get_user_stats',
  get_activity_overview: 'get_activity_overview',
  get_financial_summary: 'get_financial_summary',
  get_system_health: 'get_system_health',
  manage_user: 'manage_user',
  create_complaint: 'create_complaint',
  update_complaint: 'update_complaint',
  add_complaint_comment: 'add_complaint_comment',
  create_contract: 'create_contract',
  update_contract: 'update_contract',
  delete_contract: 'delete_contract',
  bulk_update_contracts: 'bulk_update_contracts',
  create_provider: 'create_provider',
  update_provider: 'update_provider',
  create_humanitarian_org: 'create_humanitarian_org',
};

/**
 * Sistem prompt za AI
 */
export function generateMcpPrompt(): string {
  const readTools = ['get_contracts', 'get_providers', 'get_complaints', 'search_entities'];
  const writeTools = [
    'create_complaint',
    'update_complaint',
    'add_complaint_comment',
    'create_contract',
    'update_contract',
    'delete_contract',
    'bulk_update_contracts',
    'create_provider',
    'update_provider',
    'create_humanitarian_org'
  ];

  const toolList = new InternalMcpServer().tools.map(t => {
    const roleInfo = 'Roles: ADMIN, MANAGER, AGENT, USER';
    return `- ${t.name}: ${t.description} (${roleInfo})\n  Input schema: ${JSON.stringify(t.inputSchema)}`;
  }).join('\n');

  return `
You are an AI assistant with access to a Model Context Protocol server that exposes both read and write tools. 

For each tool, you know:
- name
- description
- required user roles
- input schema

Your responsibilities:
1. Before executing any tool, check the user's role.
2. Validate all required fields from the input schema.
3. Provide clear feedback if fields are missing or the user lacks permissions.
4. Read tools (example): ${readTools.join(', ')}
5. Write tools (example): ${writeTools.join(', ')}

Available tools:
${toolList}

Always respond in structured JSON:
{
  success: true|false,
  message: string,
  data: any (optional)
}

Do not attempt operations not exposed by the MCP server. 
Use tools exactly as defined and respect role permissions.
`;
}
