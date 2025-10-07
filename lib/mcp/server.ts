// lib/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import toolsDescription from '@/lib/tools-description.json';
import { logQuery } from './query-logger';

interface McpContext {
  userId: string;
  userRole: string;
}

class DatabaseMcpServer {
  private server: Server;
  private readTools: string[];
  private writeTools: string[];
  private aiPrompt: string;

  constructor() {
    this.readTools = ['get_contracts', 'get_providers', 'get_complaints', 'search_entities'];
    this.writeTools = [
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

    this.aiPrompt = this.buildPrompt();

    this.server = new Server(
      { name: 'database-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupToolHandlers();
  }

  private async getContext(): Promise<McpContext | null> {
  const session = await auth();
  if (!session?.user?.id) {
    console.log('No session or user ID found');
    return null;
  }

  console.log('User context:', { userId: session.user.id, userRole: session.user.role });
  return {
    userId: session.user.id,
    userRole: session.user.role || 'USER'
  };
}

  private buildPrompt() {
    return `
You are an AI assistant with access to the MCP server.
You know all available tools, their input schema, and required roles.

Read tools: ${this.readTools.join(', ')}
Write tools: ${this.writeTools.join(', ')}

Rules:
1. Check user role before executing any tool.
2. Validate required fields.
3. Return structured JSON:
   { success: true|false, message: string, data?: any }

Tool details:
${JSON.stringify(toolsDescription.tools, null, 2)}
`;
  }

  private setupToolHandlers() {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.log('ListToolsRequestSchema handler called');
  const context = await this.getContext();
  if (!context) {
    console.error('Unauthorized access attempt');
    throw new Error('Unauthorized');
  }

  const tools = this.getToolsForRole(context.userRole);
  console.log('Tools for role', context.userRole, ':', tools);
  const openRouterTools = tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description || 'No description available',
      parameters: t.inputSchema || {}
    }
  }));
  return { tools: openRouterTools };
});

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const context = await this.getContext();
      if (!context) throw new Error('Unauthorized');

      const { name, arguments: args } = request.params;

      if (![...this.readTools, ...this.writeTools].includes(name)) {
        throw new Error(`Unknown tool: ${name}`);
      }

      await logQuery(context.userId, name, args);

      switch (name) {
        // Read tools
        case 'get_contracts': return this.getContracts(args, context);
        case 'get_providers': return this.getProviders(args, context);
        case 'get_complaints': return this.getComplaints(args, context);
        case 'search_entities': return this.searchEntities(args, context);

        // Write tools (stub placeholders, implement DB logic here)
        case 'create_complaint': return this.writeStub('create_complaint', args, context);
        case 'update_complaint': return this.writeStub('update_complaint', args, context);
        case 'add_complaint_comment': return this.writeStub('add_complaint_comment', args, context);
        case 'create_contract': return this.writeStub('create_contract', args, context);
        case 'update_contract': return this.writeStub('update_contract', args, context);
        case 'delete_contract': return this.writeStub('delete_contract', args, context);
        case 'bulk_update_contracts': return this.writeStub('bulk_update_contracts', args, context);
        case 'create_provider': return this.writeStub('create_provider', args, context);
        case 'update_provider': return this.writeStub('update_provider', args, context);
        case 'create_humanitarian_org': return this.writeStub('create_humanitarian_org', args, context);

        default: throw new Error(`Tool ${name} is not implemented yet`);
      }
    });
  }

  private getToolsForRole(role: string) {
    const tools = Object.keys(toolsDescription.tools).map(name => ({
      name,
      description: toolsDescription.tools[name].purpose,
      inputSchema: toolsDescription.tools[name].input
    }));

    switch (role) {
      case 'ADMIN': return tools;
      case 'MANAGER': return tools.filter(t => !['create_humanitarian_org'].includes(t.name));
      case 'AGENT': return tools.filter(t => this.readTools.includes(t.name));
      default: return tools.filter(t => ['get_contracts', 'get_providers'].includes(t.name));
    }
  }

  /** --- Read Tools Implementation --- */
  private async getContracts(args: any, context: McpContext) {
    const where: any = {};
    if (args.status) where.status = args.status;
    if (args.type) where.type = args.type;
    if (context.userRole === 'USER') where.createdById = context.userId;

    const contracts = await db.contract.findMany({
      where,
      include: {
        provider: { select: { name: true, id: true } },
        humanitarianOrg: { select: { name: true, id: true } },
        parkingService: { select: { name: true, id: true } },
        createdBy: { select: { name: true, email: true } }
      },
      take: args.limit || 50,
      orderBy: { updatedAt: 'desc' }
    });

    return { content: [{ type: 'text', text: JSON.stringify(contracts, null, 2) }] };
  }

  private async getProviders(args: any, context: McpContext) {
    const where: any = {};
    if (args.isActive !== undefined) where.isActive = args.isActive;
    if (args.name) where.name = { contains: args.name, mode: 'insensitive' };

    const providers = await db.provider.findMany({
      where,
      include: { contracts: { select: { id: true, name: true, status: true } }, _count: { select: { complaints: true } } },
      take: args.limit || 50,
      orderBy: { name: 'asc' }
    });

    return { content: [{ type: 'text', text: JSON.stringify(providers, null, 2) }] };
  }

  private async getComplaints(args: any, context: McpContext) {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) throw new Error('Insufficient permissions');
    const where: any = {};
    if (args.status) where.status = args.status;
    if (args.priority) where.priority = args.priority;
    if (args.assignedAgentId) where.assignedAgentId = args.assignedAgentId;

    if (context.userRole === 'AGENT') {
      where.OR = [{ assignedAgentId: context.userId }, { submittedById: context.userId }];
    }

    const complaints = await db.complaint.findMany({
      where,
      include: {
        submittedBy: { select: { name: true, email: true } },
        assignedAgent: { select: { name: true, email: true } },
        service: { select: { name: true, type: true } },
        provider: { select: { name: true } }
      },
      take: args.limit || 50,
      orderBy: { createdAt: 'desc' }
    });

    return { content: [{ type: 'text', text: JSON.stringify(complaints, null, 2) }] };
  }

  private async searchEntities(args: any, context: McpContext) {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) throw new Error('Insufficient permissions');

    const results = await Promise.all([
      db.contract.findMany({ where: { OR: [{ name: { contains: args.query, mode: 'insensitive' } }, { contractNumber: { contains: args.query, mode: 'insensitive' } }] }, take: 10, select: { id: true, name: true, contractNumber: true, type: true, status: true } }),
      db.provider.findMany({ where: { name: { contains: args.query, mode: 'insensitive' } }, take: 10, select: { id: true, name: true, email: true, isActive: true } }),
      db.complaint.findMany({ where: { OR: [{ title: { contains: args.query, mode: 'insensitive' } }, { description: { contains: args.query, mode: 'insensitive' } }] }, take: 10, select: { id: true, title: true, status: true, priority: true } })
    ]);

    return { content: [{ type: 'text', text: JSON.stringify({ contracts: results[0], providers: results[1], complaints: results[2] }, null, 2) }] };
  }

  /** --- Write Tools Stub --- */
  private async writeStub(toolName: string, args: any, context: McpContext) {
    return {
      success: true,
      message: `Executed write tool "${toolName}" (stub)`,
      data: { args, user: context.userId }
    };
  }

  /** --- Run Server --- */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

export { DatabaseMcpServer };
