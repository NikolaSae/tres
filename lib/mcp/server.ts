// lib/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { logQuery } from './query-logger';

interface McpContext {
  userId: string;
  userRole: string;
}

class DatabaseMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'database-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private async getContext(): Promise<McpContext | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    
    return {
      userId: session.user.id,
      userRole: session.user.role || 'USER'
    };
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const context = await this.getContext();
      if (!context) throw new Error('Unauthorized');

      const tools = this.getToolsForRole(context.userRole);
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const context = await this.getContext();
      if (!context) throw new Error('Unauthorized');

      const { name, arguments: args } = request.params;
      
      await logQuery(context.userId, name, args);

      switch (name) {
        case 'get_contracts':
          return this.getContracts(args, context);
        case 'get_providers':
          return this.getProviders(args, context);
        case 'get_complaints':
          return this.getComplaints(args, context);
        case 'search_entities':
          return this.searchEntities(args, context);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private getToolsForRole(role: string) {
    const basTools = [
      {
        name: 'get_contracts',
        description: 'Get contracts with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'PENDING'] },
            type: { type: 'string', enum: ['PROVIDER', 'HUMANITARIAN', 'PARKING'] },
            limit: { type: 'number', default: 50 }
          }
        }
      },
      {
        name: 'get_providers',
        description: 'Get providers with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean' },
            name: { type: 'string' },
            limit: { type: 'number', default: 50 }
          }
        }
      }
    ];

    if (['ADMIN', 'MANAGER', 'AGENT'].includes(role)) {
      basTools.push({
        name: 'get_complaints',
        description: 'Get complaints with filters',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            priority: { type: 'number' },
            assignedAgentId: { type: 'string' },
            limit: { type: 'number', default: 50 }
          }
        }
      });
    }

    if (['ADMIN', 'MANAGER'].includes(role)) {
      basTools.push({
        name: 'search_entities',
        description: 'Advanced search across multiple entities',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            entities: { type: 'array', items: { type: 'string' } },
            limit: { type: 'number', default: 20 }
          },
          required: ['query']
        }
      });
    }

    return basTools;
  }

  private async getContracts(args: any, context: McpContext) {
    const where: any = {};
    
    if (args.status) where.status = args.status;
    if (args.type) where.type = args.type;

    if (context.userRole === 'USER') {
      where.createdById = context.userId;
    }

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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(contracts, null, 2)
        }
      ]
    };
  }

  private async getProviders(args: any, context: McpContext) {
    const where: any = {};
    
    if (args.isActive !== undefined) where.isActive = args.isActive;
    if (args.name) {
      where.name = { contains: args.name, mode: 'insensitive' };
    }

    const providers = await db.provider.findMany({
      where,
      include: {
        contracts: {
          select: { id: true, name: true, status: true }
        },
        _count: { select: { complaints: true } }
      },
      take: args.limit || 50,
      orderBy: { name: 'asc' }
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(providers, null, 2)
        }
      ]
    };
  }

  private async getComplaints(args: any, context: McpContext) {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      throw new Error('Insufficient permissions');
    }

    const where: any = {};
    
    if (args.status) where.status = args.status;
    if (args.priority) where.priority = args.priority;
    if (args.assignedAgentId) where.assignedAgentId = args.assignedAgentId;

    if (context.userRole === 'AGENT') {
      where.OR = [
        { assignedAgentId: context.userId },
        { submittedById: context.userId }
      ];
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(complaints, null, 2)
        }
      ]
    };
  }

  private async searchEntities(args: any, context: McpContext) {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      throw new Error('Insufficient permissions');
    }

    const results = await Promise.all([
      db.contract.findMany({
        where: {
          OR: [
            { name: { contains: args.query, mode: 'insensitive' } },
            { contractNumber: { contains: args.query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        select: { id: true, name: true, contractNumber: true, type: true, status: true }
      }),
      
      db.provider.findMany({
        where: { name: { contains: args.query, mode: 'insensitive' } },
        take: 10,
        select: { id: true, name: true, email: true, isActive: true }
      }),

      db.complaint.findMany({
        where: {
          OR: [
            { title: { contains: args.query, mode: 'insensitive' } },
            { description: { contains: args.query, mode: 'insensitive' } }
          ]
        },
        take: 10,
        select: { id: true, title: true, status: true, priority: true }
      })
    ]);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            contracts: results[0],
            providers: results[1],
            complaints: results[2]
          }, null, 2)
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

export { DatabaseMcpServer };