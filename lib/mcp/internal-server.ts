// lib/mcp/internal-server.ts
import { db } from '@/lib/db';
import { logQuery } from './query-logger';
import { writeOperations } from './write-tools';
import type {
  McpContext,
  McpTool,
  McpResult,
  ContractFilters,
  ProviderFilters,
  ComplaintFilters,
  SearchEntityParams,
  UserStatsParams,
  ActivityOverviewParams,
  FinancialSummaryParams,
  SystemHealthParams
} from './types';

export class InternalMcpServer {

  /** 
   * Returns all available tools for a specific user role (READ + WRITE)
   */
  getToolsForRole(role: string): McpTool[] {
    console.log('🔧 Getting tools for role:', role);
    
    const readTools = this.getReadTools(role);
    const writeToolsRaw = writeOperations.getWriteToolsForRole(role);
    
    // ✅ Convert WriteTools to McpTools format
    const writeTools: McpTool[] = writeToolsRaw.map(wt => ({
      name: wt.name,
      category: 'write',
      description: wt.description,
      examples: [], // Add examples if needed
      inputSchema: wt.inputSchema,
      responseFormat: 'Returns { success: boolean, data?: any, error?: string }'
    }));
    
    const allTools = [...readTools, ...writeTools];
    console.log(`📋 Found ${allTools.length} tools for ${role}`);
    
    return allTools;
  }
  describeTools(role: string) {
  const tools = this.getToolsForRole(role);
  return tools.map(tool => ({
    name: tool.name,
    category: tool.category,
    description: tool.description,
    examples: tool.examples
  }));
}
  /**
   * READ TOOLS
   */
  private getReadTools(role: string): McpTool[] {
    const baseTools: McpTool[] = [
      {
        name: 'get_contracts',
        category: 'read',
        description: 'Dohvati ugovore sa filterima i paginacijom',
        examples: ['Prikaži sve aktivne ugovore', 'Ugovori koji ističu'],
        responseFormat: 'Returns { contracts: [...], total: number, summary: {...} }',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            type: { type: 'string' },
            limit: { type: 'number', default: 10 },
            offset: { type: 'number', default: 0 }
          }
        }
      },
      {
        name: 'get_providers',
        category: 'read',
        description: 'Dohvati provajdere sa filterima',
        examples: ['Nađi aktivne provajdere', 'Pretraži Telekom'],
        responseFormat: 'Returns { providers: [...], total: number }',
        inputSchema: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean' },
            name: { type: 'string' },
            limit: { type: 'number', default: 10 }
          }
        }
      },
      {
        name: 'get_user_stats',
        category: 'analytics',
        description: 'Statistika korisničke aktivnosti',
        examples: ['Moja aktivnost ovaj mesec', 'Statistika'],
        responseFormat: 'Returns { period: string, stats: {...} }',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['week', 'month', 'year'], default: 'month' }
          }
        }
      }
    ];

    // Add role-specific READ tools
    if (['ADMIN', 'MANAGER', 'AGENT'].includes(role)) {
      baseTools.push({
        name: 'get_complaints',
        category: 'read',
        description: 'Dohvati žalbe sa filterima',
        examples: ['Prikaži sve NOVE žalbe', 'Moje žalbe'],
        responseFormat: 'Returns { complaints: [...], total: number }',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            priority: { type: 'number' },
            limit: { type: 'number', default: 10 }
          }
        }
      });

      baseTools.push({
        name: 'get_activity_overview',
        category: 'analytics',
        description: 'Pregled aktivnosti sistema',
        examples: ['Aktivnost danas', 'Pregled za ovu nedelju'],
        responseFormat: 'Returns { period: string, overview: {...} }',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['today', 'week', 'month'], default: 'week' }
          }
        }
      });
    }

    if (['ADMIN', 'MANAGER'].includes(role)) {
      baseTools.push(
        {
          name: 'search_entities',
          category: 'read',
          description: 'Pretraži sve entitete',
          examples: ['Pretraži Telekom', 'Humanitarne org. sa kratkim brojem'],
          responseFormat: 'Returns { contracts: [...], providers: [...], complaints: [...], humanitarianOrgs: [...] }',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              onlyWithShortNumbers: { type: 'boolean', default: false },
              limit: { type: 'number', default: 20 }
            }
          }
        },
        {
          name: 'get_financial_summary',
          category: 'analytics',
          description: 'Finansijski pregled ugovora',
          examples: ['Finansijski izveštaj za mesec'],
          responseFormat: 'Returns { period: string, financial: {...} }',
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', default: 'month' },
              contractType: { type: 'string' }
            }
          }
        }
      );
    }

    if (role === 'ADMIN') {
      baseTools.push({
        name: 'get_system_health',
        category: 'system',
        description: 'Provera zdravlja sistema (SAMO ADMIN)',
        examples: ['Proveri sistem', 'System health'],
        responseFormat: 'Returns { system: {...} }',
        inputSchema: {
          type: 'object',
          properties: {
            includeDetails: { type: 'boolean', default: false }
          }
        }
      });
    }

    return baseTools;
  }


  async executeTool(toolName: string, args: any, context: McpContext): Promise<McpResult> {
    const startTime = Date.now();

    try {
      await logQuery(context.userId, toolName, args);

      // Read tool first
      const readResult = await this.executeReadTool(toolName, args, context);
      const result: McpResult = readResult ?? await writeOperations.executeWriteTool(toolName, args, context);

      result.metadata = { ...(result.metadata || {}), executionTime: Date.now() - startTime };
      return result;

    } catch (error: any) {
      console.error(`[MCP ERROR] ${toolName}:`, error);
      return { success: false, error: error.message || 'Unknown error', metadata: { executionTime: Date.now() - startTime } };
    }
  }

  /** Dispatches read tools */
  private async executeReadTool(toolName: string, args: any, context: McpContext): Promise<McpResult | null> {
    const toolMap: Record<string, (args: any, ctx: McpContext) => Promise<McpResult>> = {
      get_contracts: this.getContracts,
      get_providers: this.getProviders,
      get_complaints: this.getComplaints,
      search_entities: this.searchEntities,
      get_user_stats: this.getUserStats,
      get_activity_overview: this.getActivityOverview,
      get_financial_summary: this.getFinancialSummary,
      get_system_health: this.getSystemHealth
    };
    const fn = toolMap[toolName]?.bind(this);
    return fn ? await fn(args, context) : null;
  }
  // ============================================
  // READ TOOL IMPLEMENTATIONS
  // ============================================
  private async getContracts(args: ContractFilters, context: McpContext): Promise<McpResult> {
    const where: any = { ...(args.status && { status: args.status }), ...(args.type && { type: args.type }) };
    if (context.userRole === 'USER') where.createdById = context.userId;

    const orderBy = args.orderBy || { updatedAt: 'desc' };
    const [totalCount, contracts] = await Promise.all([
      db.contract.count({ where }),
      db.contract.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true } },
          humanitarianOrg: { select: { id: true, name: true } },
          parkingService: { select: { id: true, name: true } },
          createdBy: { select: { name: true, email: true } },
          _count: { select: { services: true, attachments: true, renewals: true } }
        },
        take: args.limit || 10,
        skip: Math.max(0, args.offset || 0),
        orderBy
      })
    ]);

    const summary = {
      active: await db.contract.count({ where: { ...where, status: 'ACTIVE' } }),
      expired: await db.contract.count({ where: { ...where, status: 'EXPIRED' } }),
      pending: await db.contract.count({ where: { ...where, status: 'PENDING' } })
    };

    return { success: true, data: { contracts, total: totalCount, displayed: contracts.length, summary }, metadata: { recordsAffected: contracts.length } };
  }

  private async getProviders(args: ProviderFilters): Promise<McpResult> {
    const where: any = {};
    if (args.isActive !== undefined) where.isActive = args.isActive;
    if (args.name) where.name = { contains: args.name, mode: 'insensitive' };

    const orderBy = args.orderBy || { name: 'asc' };
    const [totalCount, providers] = await Promise.all([
      db.provider.count({ where }),
      db.provider.findMany({
        where,
        include: { contracts: { select: { id: true, name: true, status: true }, take: 5 }, _count: { select: { complaints: true, contracts: true, vasServices: true } } },
        take: args.limit || 10,
        skip: Math.max(0, args.offset || 0),
        orderBy
      })
    ]);

    const summary = {
      active: await db.provider.count({ where: { ...where, isActive: true } }),
      inactive: await db.provider.count({ where: { ...where, isActive: false } })
    };

    return { success: true, data: { providers, total: totalCount, displayed: providers.length, summary }, metadata: { recordsAffected: providers.length } };
  }

  private async getComplaints(args: ComplaintFilters, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) return { success: false, error: 'Insufficient permissions' };

    const where: any = {};
    if (args.status) where.status = args.status;
    if (args.priority) where.priority = args.priority;
    if (args.assignedAgentId) where.assignedAgentId = args.assignedAgentId;
    if (context.userRole === 'AGENT') where.OR = [{ assignedAgentId: context.userId }, { submittedById: context.userId }];

    const orderBy = args.orderBy || { createdAt: 'desc' };
    const [totalCount, complaints] = await Promise.all([
      db.complaint.count({ where }),
      db.complaint.findMany({
        where,
        include: { submittedBy: { select: { name: true, email: true } }, assignedAgent: { select: { name: true, email: true } }, service: { select: { name: true, type: true } }, provider: { select: { name: true } }, _count: { select: { comments: true } } },
        take: args.limit || 10,
        skip: Math.max(0, args.offset || 0),
        orderBy
      })
    ]);

    const summary = {
      new: await db.complaint.count({ where: { ...where, status: 'NEW' } }),
      inProgress: await db.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      resolved: await db.complaint.count({ where: { ...where, status: 'RESOLVED' } })
    };

    return { success: true, data: { complaints, total: totalCount, displayed: complaints.length, summary }, metadata: { recordsAffected: complaints.length } };
  }

  private async searchEntities(args: SearchEntityParams): Promise<McpResult> {
    const entities = args.entities || ['contracts', 'providers', 'complaints', 'humanitarian_orgs'];
    const limit = args.limit || 20;
    const offset = args.offset || 0;
    const results: Record<string, any> = {};

    const limitPerEntity = Math.floor(limit / entities.length);

    const promises: Promise<void>[] = [];

    if (entities.includes('contracts')) {
      promises.push((async () => {
        results.contracts = await db.contract.findMany({ where: { OR: [{ name: { contains: args.query, mode: 'insensitive' } }, { contractNumber: { contains: args.query, mode: 'insensitive' } }, { description: { contains: args.query, mode: 'insensitive' } }] }, take: limitPerEntity, skip: Math.floor(offset / entities.length) });
        results.contractsTotal = await db.contract.count({ where: { OR: [{ name: { contains: args.query, mode: 'insensitive' } }, { contractNumber: { contains: args.query, mode: 'insensitive' } }, { description: { contains: args.query, mode: 'insensitive' } }] } });
      })());
    }

    if (entities.includes('providers')) {
      promises.push((async () => {
        results.providers = await db.provider.findMany({ where: { OR: [{ name: { contains: args.query, mode: 'insensitive' } }, { contactName: { contains: args.query, mode: 'insensitive' } }, { email: { contains: args.query, mode: 'insensitive' } }] }, take: limitPerEntity, skip: Math.floor(offset / entities.length) });
        results.providersTotal = await db.provider.count({ where: { OR: [{ name: { contains: args.query, mode: 'insensitive' } }, { contactName: { contains: args.query, mode: 'insensitive' } }, { email: { contains: args.query, mode: 'insensitive' } }] } });
      })());
    }

    if (entities.includes('complaints')) {
      promises.push((async () => {
        results.complaints = await db.complaint.findMany({ where: { OR: [{ title: { contains: args.query, mode: 'insensitive' } }, { description: { contains: args.query, mode: 'insensitive' } }] }, take: limitPerEntity, skip: Math.floor(offset / entities.length) });
        results.complaintsTotal = await db.complaint.count({ where: { OR: [{ title: { contains: args.query, mode: 'insensitive' } }, { description: { contains: args.query, mode: 'insensitive' } }] } });
      })());
    }

    if (entities.includes('humanitarian_orgs') || args.onlyWithShortNumbers) {
      promises.push((async () => {
        results.humanitarianOrgs = await db.humanitarianOrg.findMany({
          where: args.onlyWithShortNumbers ? { shortNumber: { not: null } } : { OR: [{ name: { contains: args.query, mode: 'insensitive' } }, { shortNumber: { contains: args.query, mode: 'insensitive' } }] },
          take: limitPerEntity, skip: Math.floor(offset / entities.length)
        });
        results.humanitarianOrgsTotal = await db.humanitarianOrg.count({
          where: args.onlyWithShortNumbers ? { shortNumber: { not: null } } : { OR: [{ name: { contains: args.query, mode: 'insensitive' } }, { shortNumber: { contains: args.query, mode: 'insensitive' } }] }
        });
      })());
    }

    await Promise.all(promises);
    return { success: true, data: results };
  }

  private async getUserStats(args: UserStatsParams, context: McpContext): Promise<McpResult> {
    const dateFrom = new Date();
    switch (args.period) {
      case 'week': dateFrom.setDate(dateFrom.getDate() - 7); break;
      case 'month': dateFrom.setMonth(dateFrom.getMonth() - 1); break;
      case 'year': dateFrom.setFullYear(dateFrom.getFullYear() - 1); break;
    }

    const [contractsCreated, complaintsSubmitted, activitiesCount] = await Promise.all([
      db.contract.count({ where: { createdById: context.userId, createdAt: { gte: dateFrom } } }),
      db.complaint.count({ where: { submittedById: context.userId, createdAt: { gte: dateFrom } } }),
      db.activityLog.count({ where: { userId: context.userId, createdAt: { gte: dateFrom } } })
    ]);

    return { success: true, data: { period: args.period, stats: { contractsCreated, complaintsSubmitted, activitiesCount } } };
  }

  private async getActivityOverview(args: ActivityOverviewParams): Promise<McpResult> {
    const dateFrom = new Date();
    switch (args.period) {
      case 'today': dateFrom.setHours(0, 0, 0, 0); break;
      case 'week': dateFrom.setDate(dateFrom.getDate() - 7); break;
      case 'month': dateFrom.setMonth(dateFrom.getMonth() - 1); break;
    }

    const [newContracts, expiringContracts, newComplaints, activeRenewals, recentActivities] = await Promise.all([
      db.contract.count({ where: { createdAt: { gte: dateFrom } } }),
      db.contract.count({ where: { status: 'ACTIVE', endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } }),
      db.complaint.count({ where: { createdAt: { gte: dateFrom } } }),
      db.contractRenewal.count({ where: { createdAt: { gte: dateFrom } } }),
      db.activityLog.count({ where: { createdAt: { gte: dateFrom } } })
    ]);

    return { success: true, data: { period: args.period, overview: { newContracts, expiringContracts, newComplaints, activeRenewals, recentActivities } } };
  }

  private async getFinancialSummary(args: FinancialSummaryParams): Promise<McpResult> {
    const activeContracts = await db.contract.count({ where: { status: 'ACTIVE', ...(args.contractType && { type: args.contractType }) } });
    const totalRevenue = await db.contract.aggregate({ where: { status: 'ACTIVE', ...(args.contractType && { type: args.contractType }) }, _sum: { revenuePercentage: true } });

    return { success: true, data: { period: args.period || 'month', financial: { activeContracts, averageRevenuePercentage: totalRevenue._sum.revenuePercentage ? totalRevenue._sum.revenuePercentage / activeContracts : 0, contractType: args.contractType || 'all' } } };
  }

  private async getSystemHealth(): Promise<McpResult> {
    const [totalUsers, activeUsers, totalContracts, activeContracts, pendingComplaints] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.contract.count(),
      db.contract.count({ where: { status: 'ACTIVE' } }),
      db.complaint.count({ where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } } })
    ]);

    return { success: true, data: { system: { users: { total: totalUsers, active: activeUsers }, contracts: { total: totalContracts, active: activeContracts }, complaints: { pending: pendingComplaints } } } };
  }
}

// Export tipova
export type { McpContext, McpTool, McpResult } from './types';
