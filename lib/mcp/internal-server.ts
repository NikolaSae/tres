// lib/mcp/internal-server.ts - Potpuno ažurirana verzija sa Email Tools

import { db } from '@/lib/db';
import type { McpContext, McpResult, McpTool } from './types';
import { WriteOperations } from './write-tools';
import { EmailOperations } from './email-tools';
import { logQuery } from './query-logger';

/**
 * Internal MCP Server - bez eksterne MCP SDK zavisnosti
 * Koristi se direktno kroz Next.js API routes
 */
export class InternalMcpServer {
  private writeOps: WriteOperations;
  private emailOps: EmailOperations;

  constructor() {
    this.writeOps = new WriteOperations();
    this.emailOps = new EmailOperations();
  }

  /**
   * Vraća sve alate dostupne korisniku na osnovu uloge
   */
  getToolsForRole(role: string): McpTool[] {
    const readTools = this.getReadTools();
    const writeTools = this.writeOps.getWriteToolsForRole(role);
    const emailTools = this.emailOps.getEmailToolsForRole(role);
    const analyticsTools = this.getAnalyticsTools(role);
    const systemTools = this.getSystemTools(role);

    return [
      ...readTools.map(t => ({ ...t, category: 'read' as const })),
      ...writeTools.map(t => ({ ...t, category: 'write' as const })),
      ...emailTools.map(t => ({ ...t, category: 'email' as const })),
      ...analyticsTools.map(t => ({ ...t, category: 'analytics' as const })),
      ...systemTools.map(t => ({ ...t, category: 'system' as const }))
    ];
  }

  /**
   * Izvršava alat sa datim parametrima
   */
  async executeTool(
    toolName: string,
    params: any,
    context: McpContext
  ): Promise<McpResult> {
    try {
      // Log poziva alata
      await logQuery(context.userId, toolName, params);

      // Proveri permisije
      const tools = this.getToolsForRole(context.userRole);
      const tool = tools.find(t => t.name === toolName);

      if (!tool) {
        return {
          success: false,
          error: `Tool "${toolName}" not available for role ${context.userRole}`
        };
      }

      // Validacija parametara prema inputSchema
      const validation = this.validateParams(params, tool.inputSchema);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid parameters: ${validation.errors.join(', ')}`
        };
      }

      // Routiranje po kategorijama
      switch (tool.category) {
        case 'read':
          return await this.executeReadTool(toolName, params, context);
        case 'write':
          return await this.writeOps.executeWriteTool(toolName, params, context);
        case 'email':
          return await this.emailOps.executeEmailTool(toolName, params, context);
        case 'analytics':
          return await this.executeAnalyticsTool(toolName, params, context);
        case 'system':
          return await this.executeSystemTool(toolName, params, context);
        default:
          return {
            success: false,
            error: `Unknown tool category: ${tool.category}`
          };
      }
    } catch (error) {
      console.error(`Tool execution error [${toolName}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ============================================
  // READ TOOLS DEFINITION
  // ============================================

  private getReadTools(): Omit<McpTool, 'category'>[] {
    return [
      {
        name: 'get_contracts',
        description: 'Get list of contracts with filtering options',
        examples: [
          'Prikaži sve aktivne ugovore',
          'Lista ugovora koji ističu uskoro',
          'Ugovori sa Telekomom'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ACTIVE', 'EXPIRED', 'PENDING', 'RENEWAL_IN_PROGRESS', 'TERMINATED'],
              description: 'Filter by contract status'
            },
            type: {
              type: 'string',
              enum: ['PROVIDER', 'HUMANITARIAN', 'PARKING', 'BULK'],
              description: 'Filter by contract type'
            },
            providerId: { type: 'string', description: 'Filter by provider ID' },
            limit: { type: 'number', default: 50, description: 'Max results to return' },
            offset: { type: 'number', default: 0, description: 'Pagination offset' }
          }
        }
      },
      {
        name: 'get_providers',
        description: 'Get list of providers with filtering',
        examples: [
          'Prikaži sve aktivne provajdere',
          'Lista neaktivnih provajdera',
          'Pretraži Telekom'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean', description: 'Filter by active status' },
            name: { type: 'string', description: 'Search by name (partial match)' },
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 }
          }
        }
      },
      {
        name: 'get_complaints',
        description: 'Get list of complaints (requires ADMIN/MANAGER/AGENT role)',
        examples: [
          'Prikaži sve žalbe',
          'Visoko prioritetne žalbe',
          'Moje dodeljene žalbe'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED']
            },
            priority: { type: 'number', minimum: 1, maximum: 5 },
            assignedAgentId: { type: 'string' },
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 }
          }
        },
        requiredRole: ['ADMIN', 'MANAGER', 'AGENT']
      },
      {
        name: 'search_entities',
        description: 'Search across contracts, providers, complaints, and humanitarian orgs',
        examples: [
          'Pretraži Telekom',
          'Pronađi sve što sadrži "humanitarna"',
          'Search MTS'
        ],
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', minLength: 2, description: 'Search term' },
            entities: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['contracts', 'providers', 'complaints', 'humanitarian_orgs']
              },
              default: ['contracts', 'providers', 'complaints', 'humanitarian_orgs']
            },
            limit: { type: 'number', default: 20 }
          },
          required: ['query']
        },
        requiredRole: ['ADMIN', 'MANAGER']
      }
    ];
  }

  // ============================================
  // ANALYTICS TOOLS DEFINITION
  // ============================================

  private getAnalyticsTools(role: string): Omit<McpTool, 'category'>[] {
    const tools: Omit<McpTool, 'category'>[] = [];

    // Svi korisnici mogu videti svoje statistike
    tools.push({
      name: 'get_user_stats',
      description: 'Get user activity statistics',
      examples: ['Moja statistika', 'Aktivnost ovog meseca'],
      inputSchema: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'week', 'month', 'quarter', 'year'],
            default: 'month'
          }
        }
      }
    });

    // Manager i Admin dobijaju dodatne analytics alate
    if (['ADMIN', 'MANAGER'].includes(role)) {
      tools.push(
        {
          name: 'get_financial_summary',
          description: 'Get financial summary and revenue statistics',
          examples: ['Finansijski izveštaj', 'Prihodi ovog meseca'],
          inputSchema: {
            type: 'object',
            properties: {
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' },
              groupBy: {
                type: 'string',
                enum: ['provider', 'type', 'month'],
                default: 'provider'
              }
            }
          },
          requiredRole: ['ADMIN', 'MANAGER']
        },
        {
          name: 'get_activity_overview',
          description: 'Get overview of recent activities and pending actions',
          examples: ['Šta se desilo danas?', 'Pregled aktivnosti ove nedelje'],
          inputSchema: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                enum: ['today', 'week', 'month'],
                default: 'today'
              }
            }
          },
          requiredRole: ['ADMIN', 'MANAGER']
        }
      );
    }

    // Samo Admin dobija system health
    if (role === 'ADMIN') {
      tools.push({
        name: 'get_system_health',
        description: 'Get overall system health metrics',
        examples: ['Status sistema', 'Zdravlje sistema'],
        inputSchema: { type: 'object', properties: {} },
        requiredRole: ['ADMIN']
      });
    }

    return tools;
  }

  // ============================================
  // SYSTEM TOOLS DEFINITION
  // ============================================

  private getSystemTools(role: string): Omit<McpTool, 'category'>[] {
    if (role !== 'ADMIN') return [];

    return [
      {
        name: 'export_data',
        description: 'Export data to CSV/Excel',
        examples: ['Eksportuj ugovore u CSV', 'Download provider lista'],
        inputSchema: {
          type: 'object',
          properties: {
            entityType: {
              type: 'string',
              enum: ['contracts', 'providers', 'complaints'],
              description: 'Type of data to export'
            },
            format: {
              type: 'string',
              enum: ['csv', 'excel'],
              default: 'csv'
            },
            filters: { type: 'object', description: 'Optional filters' }
          },
          required: ['entityType']
        },
        requiredRole: ['ADMIN']
      }
    ];
  }

  // ============================================
  // READ TOOLS IMPLEMENTATION
  // ============================================

  private async executeReadTool(
    toolName: string,
    params: any,
    context: McpContext
  ): Promise<McpResult> {
    switch (toolName) {
      case 'get_contracts':
        return await this.getContracts(params, context);
      case 'get_providers':
        return await this.getProviders(params, context);
      case 'get_complaints':
        return await this.getComplaints(params, context);
      case 'search_entities':
        return await this.searchEntities(params, context);
      default:
        return { success: false, error: `Unknown read tool: ${toolName}` };
    }
  }

  private async getContracts(params: any, context: McpContext): Promise<McpResult> {
    try {
      const where: any = {};
      
      if (params.status) where.status = params.status;
      if (params.type) where.type = params.type;
      if (params.providerId) where.providerId = params.providerId;
      
      // USER vidi samo svoje ugovore
      if (context.userRole === 'USER') {
        where.createdById = context.userId;
      }

      const [contracts, total] = await Promise.all([
        db.contract.findMany({
          where,
          include: {
            provider: { select: { name: true, id: true } },
            humanitarianOrg: { select: { name: true, id: true } },
            parkingService: { select: { name: true, id: true } },
            createdBy: { select: { name: true, email: true } }
          },
          take: params.limit || 50,
          skip: params.offset || 0,
          orderBy: { updatedAt: 'desc' }
        }),
        db.contract.count({ where })
      ]);

      // Statistika
      const summary = await db.contract.groupBy({
        by: ['status'],
        where,
        _count: true
      });

      return {
        success: true,
        data: {
          contracts,
          total,
          displayed: contracts.length,
          summary: {
            active: summary.find(s => s.status === 'ACTIVE')?._count || 0,
            expired: summary.find(s => s.status === 'EXPIRED')?._count || 0,
            pending: summary.find(s => s.status === 'PENDING')?._count || 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get contracts: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getProviders(params: any, context: McpContext): Promise<McpResult> {
    try {
      const where: any = {};
      
      if (params.isActive !== undefined) where.isActive = params.isActive;
      if (params.name) {
        where.name = { contains: params.name, mode: 'insensitive' };
      }

      const [providers, total] = await Promise.all([
        db.provider.findMany({
          where,
          include: {
            _count: {
              select: {
                contracts: true,
                complaints: true
              }
            }
          },
          take: params.limit || 50,
          skip: params.offset || 0,
          orderBy: { name: 'asc' }
        }),
        db.provider.count({ where })
      ]);

      return {
        success: true,
        data: {
          providers,
          total,
          displayed: providers.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get providers: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getComplaints(params: any, context: McpContext): Promise<McpResult> {
    // Provera permisija
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions to view complaints' };
    }

    try {
      const where: any = {};
      
      if (params.status) where.status = params.status;
      if (params.priority) where.priority = params.priority;
      if (params.assignedAgentId) where.assignedAgentId = params.assignedAgentId;

      // Agent vidi samo svoje žalbe ili one koje je podneo
      if (context.userRole === 'AGENT') {
        where.OR = [
          { assignedAgentId: context.userId },
          { submittedById: context.userId }
        ];
      }

      const [complaints, total] = await Promise.all([
        db.complaint.findMany({
          where,
          include: {
            submittedBy: { select: { name: true, email: true } },
            assignedAgent: { select: { name: true, email: true } },
            service: { select: { name: true, type: true } },
            provider: { select: { name: true } }
          },
          take: params.limit || 50,
          skip: params.offset || 0,
          orderBy: { createdAt: 'desc' }
        }),
        db.complaint.count({ where })
      ]);

      // Statistika po statusima
      const summary = await db.complaint.groupBy({
        by: ['status'],
        where,
        _count: true
      });

      return {
        success: true,
        data: {
          complaints,
          total,
          displayed: complaints.length,
          summary: {
            new: summary.find(s => s.status === 'NEW')?._count || 0,
            inProgress: summary.find(s => s.status === 'IN_PROGRESS')?._count || 0,
            resolved: summary.find(s => s.status === 'RESOLVED')?._count || 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get complaints: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async searchEntities(params: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions for search' };
    }

    try {
      const { query, entities = ['contracts', 'providers', 'complaints', 'humanitarian_orgs'], limit = 20 } = params;

      const results: any = {};

      // Search contracts
      if (entities.includes('contracts')) {
        const contracts = await db.contract.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { contractNumber: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: limit,
          select: {
            id: true,
            name: true,
            contractNumber: true,
            type: true,
            status: true
          }
        });
        results.contracts = contracts;
        results.contractsTotal = contracts.length;
      }

      // Search providers
      if (entities.includes('providers')) {
        const providers = await db.provider.findMany({
          where: {
            name: { contains: query, mode: 'insensitive' }
          },
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        });
        results.providers = providers;
        results.providersTotal = providers.length;
      }

      // Search complaints
      if (entities.includes('complaints')) {
        const complaints = await db.complaint.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: limit,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        });
        results.complaints = complaints;
        results.complaintsTotal = complaints.length;
      }

      // Search humanitarian orgs
      if (entities.includes('humanitarian_orgs')) {
        const humanitarianOrgs = await db.humanitarianOrg.findMany({
          where: {
            name: { contains: query, mode: 'insensitive' }
          },
          take: limit,
          select: {
            id: true,
            name: true,
            shortNumber: true,
            isActive: true
          }
        });
        results.humanitarianOrgs = humanitarianOrgs;
        results.humanitarianOrgsTotal = humanitarianOrgs.length;
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ============================================
  // ANALYTICS TOOLS IMPLEMENTATION
  // ============================================

  private async executeAnalyticsTool(
    toolName: string,
    params: any,
    context: McpContext
  ): Promise<McpResult> {
    switch (toolName) {
      case 'get_user_stats':
        return await this.getUserStats(params, context);
      case 'get_financial_summary':
        return await this.getFinancialSummary(params, context);
      case 'get_activity_overview':
        return await this.getActivityOverview(params, context);
      case 'get_system_health':
        return await this.getSystemHealth(context);
      default:
        return { success: false, error: `Unknown analytics tool: ${toolName}` };
    }
  }

  private async getUserStats(params: any, context: McpContext): Promise<McpResult> {
    try {
      const { period = 'month' } = params;
      
      // Kalkulacija datuma
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const [contractsCreated, complaintsSubmitted, activities] = await Promise.all([
        db.contract.count({
          where: {
            createdById: context.userId,
            createdAt: { gte: startDate }
          }
        }),
        db.complaint.count({
          where: {
            submittedById: context.userId,
            createdAt: { gte: startDate }
          }
        }),
        db.activityLog.count({
          where: {
            userId: context.userId,
            createdAt: { gte: startDate }
          }
        })
      ]);

      return {
        success: true,
        data: {
          period,
          stats: {
            contractsCreated,
            complaintsSubmitted,
            activitiesCount: activities
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getFinancialSummary(params: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const { startDate, endDate, groupBy = 'provider' } = params;

      // TODO: Implementiraj detaljnu finansijsku logiku
      // Ovo je simplified verzija

      const contracts = await db.contract.findMany({
        where: {
          status: 'ACTIVE',
          ...(startDate && { startDate: { gte: new Date(startDate) } }),
          ...(endDate && { endDate: { lte: new Date(endDate) } })
        },
        include: {
          provider: { select: { name: true } }
        }
      });

      const totalRevenue = contracts.reduce((sum, c) => sum + (c.revenuePercentage || 0), 0);
      const avgRevenue = contracts.length > 0 ? totalRevenue / contracts.length : 0;

      return {
        success: true,
        data: {
          summary: {
            totalContracts: contracts.length,
            totalRevenueShare: totalRevenue,
            averageRevenueShare: avgRevenue
          },
          contracts: contracts.slice(0, 10) // Top 10
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get financial summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getActivityOverview(params: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const { period = 'today' } = params;
      
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      const [newContracts, expiringContracts, newComplaints, recentActivities] = await Promise.all([
        db.contract.count({
          where: { createdAt: { gte: startDate } }
        }),
        db.contract.count({
          where: {
            status: 'ACTIVE',
            endDate: {
              gte: now,
              lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dana
            }
          }
        }),
        db.complaint.count({
          where: {
            createdAt: { gte: startDate },
            status: { in: ['NEW', 'ASSIGNED'] }
          }
        }),
        db.activityLog.count({
          where: { createdAt: { gte: startDate } }
        })
      ]);

      return {
        success: true,
        data: {
          period,
          overview: {
            newContracts,
            expiringContracts,
            newComplaints,
            activeRenewals: 0, // TODO: Implementiraj renewal tracking
            recentActivities
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get activity overview: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getSystemHealth(context: McpContext): Promise<McpResult> {
    if (context.userRole !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    try {
      const [totalUsers, activeUsers, totalContracts, activeContracts, pendingComplaints] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { isActive: true } }),
        db.contract.count(),
        db.contract.count({ where: { status: 'ACTIVE' } }),
        db.complaint.count({ where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } } })
      ]);

      return {
        success: true,
        data: {
          system: {
            users: { total: totalUsers, active: activeUsers },
            contracts: { total: totalContracts, active: activeContracts },
            complaints: { pending: pendingComplaints }
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get system health: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ============================================
  // SYSTEM TOOLS IMPLEMENTATION
  // ============================================

  private async executeSystemTool(
    toolName: string,
    params: any,
    context: McpContext
  ): Promise<McpResult> {
    if (context.userRole !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    switch (toolName) {
      case 'export_data':
        return { success: false, error: 'Export functionality not yet implemented' };
      default:
        return { success: false, error: `Unknown system tool: ${toolName}` };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Validira parametre prema JSON Schema
   */
  private validateParams(params: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema || !schema.properties) {
      return { valid: true, errors };
    }

    // Proveri required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (params[field] === undefined || params[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Basic type checking
    for (const [key, prop] of Object.entries(schema.properties)) {
      const p = prop as any;
      const value = params[key];

      if (value === undefined || value === null) continue;

      // Type validation
      if (p.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (p.type !== actualType && !(p.type === 'number' && actualType === 'string' && !isNaN(Number(value)))) {
          errors.push(`Field "${key}" must be of type ${p.type}, got ${actualType}`);
        }
      }

      // Enum validation
      if (p.enum && !p.enum.includes(value)) {
        errors.push(`Field "${key}" must be one of: ${p.enum.join(', ')}`);
      }

      // Min/max validation for numbers
      if (p.type === 'number') {
        const numValue = Number(value);
        if (p.minimum !== undefined && numValue < p.minimum) {
          errors.push(`Field "${key}" must be >= ${p.minimum}`);
        }
        if (p.maximum !== undefined && numValue > p.maximum) {
          errors.push(`Field "${key}" must be <= ${p.maximum}`);
        }
      }

      // String length validation
      if (p.type === 'string') {
        if (p.minLength && value.length < p.minLength) {
          errors.push(`Field "${key}" must be at least ${p.minLength} characters`);
        }
        if (p.maxLength && value.length > p.maxLength) {
          errors.push(`Field "${key}" must be at most ${p.maxLength} characters`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}