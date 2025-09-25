// lib/mcp/internal-server.ts
import { db } from '@/lib/db';
import { logQuery } from './query-logger';

export interface McpContext {
  userId: string;
  userRole: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class InternalMcpServer {
  

  // Ažuriraj tool definitions da uključuju limit i offset
  getToolsForRole(role: string): McpTool[] {
    const baseTools: McpTool[] = [
      {
        name: 'get_contracts',
        description: 'Get contracts with optional filters, limit and offset',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'PENDING', 'RENEWAL_IN_PROGRESS', 'TERMINATED'] },
            type: { type: 'string', enum: ['PROVIDER', 'HUMANITARIAN', 'PARKING', 'BULK'] },
            limit: { type: 'number', default: 10, minimum: 1, maximum: 100 },
            offset: { type: 'number', default: 0, minimum: -100 },
            orderBy: { 
              type: 'object',
              properties: {
                createdAt: { type: 'string', enum: ['asc', 'desc'] },
                updatedAt: { type: 'string', enum: ['asc', 'desc'] },
                name: { type: 'string', enum: ['asc', 'desc'] }
              }
            }
          }
        }
      },
      {
        name: 'get_providers',
        description: 'Get providers with optional filters, limit and offset',
        inputSchema: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean' },
            name: { type: 'string' },
            limit: { type: 'number', default: 10, minimum: 1, maximum: 100 },
            offset: { type: 'number', default: 0, minimum: 0 },
            orderBy: { 
              type: 'object',
              properties: {
                name: { type: 'string', enum: ['asc', 'desc'] },
                createdAt: { type: 'string', enum: ['asc', 'desc'] }
              }
            }
          }
        }
      },
      {
        name: 'get_user_stats',
        description: 'Get user statistics and activity',
        inputSchema: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: ['week', 'month', 'year'], default: 'month' }
          }
        }
      }
    ];

    // Agent and higher roles
    if (['ADMIN', 'MANAGER', 'AGENT'].includes(role)) {
      baseTools.push(
        {
          name: 'get_complaints',
          description: 'Get complaints with filters, limit and offset',
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED'] },
              priority: { type: 'number', minimum: 1, maximum: 5 },
              assignedAgentId: { type: 'string' },
              limit: { type: 'number', default: 10, minimum: 1, maximum: 100 },
              offset: { type: 'number', default: 0, minimum: 0 },
              orderBy: { 
                type: 'object',
                properties: {
                  createdAt: { type: 'string', enum: ['asc', 'desc'] },
                  priority: { type: 'string', enum: ['asc', 'desc'] },
                  updatedAt: { type: 'string', enum: ['asc', 'desc'] }
                }
              }
            }
          }
        },
        {
          name: 'get_activity_overview',
          description: 'Get activity overview for dashboard',
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['today', 'week', 'month'], default: 'week' }
            }
          }
        }
      );
    }

    // Manager and Admin roles
    if (['ADMIN', 'MANAGER'].includes(role)) {
      baseTools.push(
        {
          name: 'search_entities',
          description: 'Advanced search across multiple entities with limit/offset support',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              entities: { 
                type: 'array', 
                items: { type: 'string', enum: ['contracts', 'providers', 'complaints', 'users', 'humanitarian_orgs'] }
              },
              limit: { type: 'number', default: 20, minimum: 1, maximum: 100 },
              offset: { type: 'number', default: 0, minimum: 0 },
              onlyWithShortNumbers: { type: 'boolean', default: false }
            },
            required: ['query']
          }
        },
        {
          name: 'get_financial_summary',
          description: 'Get financial summary and revenue data',
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['month', 'quarter', 'year'], default: 'month' },
              contractType: { type: 'string', enum: ['PROVIDER', 'HUMANITARIAN', 'PARKING'] }
            }
          }
        }
      );
    }

    // Admin only tools
    if (role === 'ADMIN') {
      baseTools.push(
        {
          name: 'get_system_health',
          description: 'Get system health metrics',
          inputSchema: {
            type: 'object',
            properties: {
              includeDetails: { type: 'boolean', default: false }
            }
          }
        },
        {
          name: 'manage_user',
          description: 'Manage user accounts (view, activate, deactivate)',
          inputSchema: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['view', 'activate', 'deactivate'] },
              userId: { type: 'string' },
              email: { type: 'string' }
            }
          }
        }
      );
    }

    return baseTools;
  }

  async executeTool(toolName: string, args: any, context: McpContext): Promise<McpResult> {
    try {
      // Log the query
      await logQuery(context.userId, toolName, args);

      switch (toolName) {
        case 'get_contracts':
          return await this.getContracts(args, context);
        case 'get_providers':
          return await this.getProviders(args, context);
        case 'get_complaints':
          return await this.getComplaints(args, context);
        case 'search_entities':
          return await this.searchEntities(args, context);
        case 'get_user_stats':
          return await this.getUserStats(args, context);
        case 'get_activity_overview':
          return await this.getActivityOverview(args, context);
        case 'get_financial_summary':
          return await this.getFinancialSummary(args, context);
        case 'get_system_health':
          return await this.getSystemHealth(args, context);
        case 'manage_user':
          return await this.manageUser(args, context);
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`MCP Tool Error [${toolName}]:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async getContracts(args: any, context: McpContext): Promise<McpResult> {
    const where: any = {};
    
    if (args.status) where.status = args.status;
    if (args.type) where.type = args.type;

    // Regular users can only see contracts they created
    if (context.userRole === 'USER') {
      where.createdById = context.userId;
    }

    // Određuj sortiranje
    let orderBy: any = { updatedAt: 'desc' }; // default
    if (args.orderBy) {
      orderBy = args.orderBy;
    }

    // Za "poslednji" rezultate, koristimo DESC sortiranje i uzimamo poslednje
    const isLastQuery = args.offset === -args.limit;
    if (isLastQuery) {
      orderBy = { createdAt: 'desc' };
    }

    // Najpre dohvati ukupan broj za summary
    const totalCount = await db.contract.count({ where });

    const contracts = await db.contract.findMany({
      where,
      include: {
        provider: { select: { name: true, id: true } },
        humanitarianOrg: { select: { name: true, id: true } },
        parkingService: { select: { name: true, id: true } },
        createdBy: { select: { name: true, email: true } },
        _count: {
          select: {
            services: true,
            attachments: true,
            renewals: true
          }
        }
      },
      take: args.limit || 10,
      skip: Math.max(0, args.offset || 0),
      orderBy
    });

    // Za "poslednji" upite, možda trebamo da ih okrenemo
    let finalContracts = contracts;
    if (isLastQuery) {
      // Ako tražimo "poslednja 3", oni su već sortirani DESC po createdAt
      // tako da su najnoviji prvi - što je ono što želimo
      finalContracts = contracts;
    }

    return {
      success: true,
      data: {
        contracts: finalContracts,
        total: totalCount,
        displayed: finalContracts.length,
        summary: {
          active: await db.contract.count({ where: { ...where, status: 'ACTIVE' } }),
          expired: await db.contract.count({ where: { ...where, status: 'EXPIRED' } }),
          pending: await db.contract.count({ where: { ...where, status: 'PENDING' } })
        }
      }
    };
  }

  private async getProviders(args: any, context: McpContext): Promise<McpResult> {
    const where: any = {};
    
    if (args.isActive !== undefined) where.isActive = args.isActive;
    if (args.name) {
      where.name = { contains: args.name, mode: 'insensitive' };
    }

    // Sortiranje
    let orderBy: any = { name: 'asc' }; // default alfabetski
    if (args.orderBy) {
      orderBy = args.orderBy;
    }

    const totalCount = await db.provider.count({ where });

    const providers = await db.provider.findMany({
      where,
      include: {
        contracts: {
          select: { id: true, name: true, status: true },
          take: 5
        },
        _count: { 
          select: { 
            complaints: true,
            contracts: true,
            vasServices: true
          } 
        }
      },
      take: args.limit || 10,
      skip: Math.max(0, args.offset || 0),
      orderBy
    });

    return {
      success: true,
      data: {
        providers,
        total: totalCount,
        displayed: providers.length,
        summary: {
          active: await db.provider.count({ where: { ...where, isActive: true } }),
          inactive: await db.provider.count({ where: { ...where, isActive: false } })
        }
      }
    };
  }

  private async getComplaints(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const where: any = {};
    
    if (args.status) where.status = args.status;
    if (args.priority) where.priority = args.priority;
    if (args.assignedAgentId) where.assignedAgentId = args.assignedAgentId;

    // Agents can only see assigned or submitted complaints
    if (context.userRole === 'AGENT') {
      where.OR = [
        { assignedAgentId: context.userId },
        { submittedById: context.userId }
      ];
    }

    // Sortiranje
    let orderBy: any = { createdAt: 'desc' }; // default najnovije prvo
    if (args.orderBy) {
      orderBy = args.orderBy;
    }

    const totalCount = await db.complaint.count({ where });

    const complaints = await db.complaint.findMany({
      where,
      include: {
        submittedBy: { select: { name: true, email: true } },
        assignedAgent: { select: { name: true, email: true } },
        service: { select: { name: true, type: true } },
        provider: { select: { name: true } },
        _count: { select: { comments: true } }
      },
      take: args.limit || 10,
      skip: Math.max(0, args.offset || 0),
      orderBy
    });

    return {
      success: true,
      data: {
        complaints,
        total: totalCount,
        displayed: complaints.length,
        summary: {
          new: await db.complaint.count({ where: { ...where, status: 'NEW' } }),
          inProgress: await db.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
          resolved: await db.complaint.count({ where: { ...where, status: 'RESOLVED' } })
        }
      }
    };
  }

  private async searchEntities(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const searchQuery = args.query;
    const entities = args.entities || ['contracts', 'providers', 'complaints'];
    const limit = args.limit || 20;
    const offset = args.offset || 0;
    const results: any = {};

    // Podjeli limit među entitetima
    const limitPerEntity = Math.floor(limit / entities.length);

    if (entities.includes('contracts')) {
      results.contracts = await db.contract.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { contractNumber: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        take: limitPerEntity,
        skip: Math.floor(offset / entities.length),
        select: { 
          id: true, name: true, contractNumber: true, 
          type: true, status: true, startDate: true, endDate: true 
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Dodaj ukupan broj za contracts
      results.contractsTotal = await db.contract.count({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { contractNumber: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
    }

    if (entities.includes('providers')) {
      results.providers = await db.provider.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { contactName: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        take: limitPerEntity,
        skip: Math.floor(offset / entities.length),
        select: { 
          id: true, name: true, email: true, phone: true, 
          isActive: true, contactName: true 
        },
        orderBy: { name: 'asc' }
      });

      results.providersTotal = await db.provider.count({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { contactName: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
    }

    if (entities.includes('complaints')) {
      results.complaints = await db.complaint.findMany({
        where: {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        take: limitPerEntity,
        skip: Math.floor(offset / entities.length),
        select: { 
          id: true, title: true, status: true, priority: true,
          createdAt: true, financialImpact: true 
        },
        orderBy: { createdAt: 'desc' }
      });

      results.complaintsTotal = await db.complaint.count({
        where: {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        }
      });
    }

    // Posebno za humanitarne organizacije
    if (entities.includes('humanitarian_orgs') || args.onlyWithShortNumbers) {
      results.humanitarianOrgs = await db.humanitarianOrg.findMany({
        where: args.onlyWithShortNumbers ? 
          { shortNumber: { not: null } } : 
          {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { shortNumber: { contains: searchQuery, mode: 'insensitive' } }
            ]
          },
        take: limitPerEntity,
        skip: Math.floor(offset / entities.length),
        select: { 
          id: true, name: true, shortNumber: true, email: true, 
          phone: true, isActive: true 
        },
        orderBy: { name: 'asc' }
      });

      results.humanitarianOrgsTotal = await db.humanitarianOrg.count({
        where: args.onlyWithShortNumbers ? 
          { shortNumber: { not: null } } : 
          {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { shortNumber: { contains: searchQuery, mode: 'insensitive' } }
            ]
          }
      });
    }

    return {
      success: true,
      data: results
    };
  }

  private async getUserStats(args: any, context: McpContext): Promise<McpResult> {
    const period = args.period || 'month';
    const dateFrom = new Date();
    
    switch (period) {
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case 'year':
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }

    const [contractsCreated, complaintsSubmitted, activitiesCount] = await Promise.all([
      db.contract.count({
        where: {
          createdById: context.userId,
          createdAt: { gte: dateFrom }
        }
      }),
      db.complaint.count({
        where: {
          submittedById: context.userId,
          createdAt: { gte: dateFrom }
        }
      }),
      db.activityLog.count({
        where: {
          userId: context.userId,
          createdAt: { gte: dateFrom }
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
          activitiesCount
        }
      }
    };
  }

  private async getActivityOverview(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const period = args.period || 'week';
    const dateFrom = new Date();
    
    switch (period) {
      case 'today':
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
    }

    const [
      newContracts,
      expiringContracts,
      newComplaints,
      activeRenewals,
      recentActivities
    ] = await Promise.all([
      db.contract.count({
        where: { createdAt: { gte: dateFrom } }
      }),
      db.contract.count({
        where: {
          status: 'ACTIVE',
          endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days
        }
      }),
      db.complaint.count({
        where: { createdAt: { gte: dateFrom } }
      }),
      db.contractRenewal.count({
        where: { createdAt: { gte: dateFrom } }
      }),
      db.activityLog.count({
        where: { createdAt: { gte: dateFrom } }
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
          activeRenewals,
          recentActivities
        }
      }
    };
  }

  private async getFinancialSummary(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // This is a placeholder - you'll need to implement based on your financial data structure
    const activeContracts = await db.contract.count({
      where: { 
        status: 'ACTIVE',
        ...(args.contractType && { type: args.contractType })
      }
    });

    const totalRevenue = await db.contract.aggregate({
      where: { 
        status: 'ACTIVE',
        ...(args.contractType && { type: args.contractType })
      },
      _sum: { revenuePercentage: true }
    });

    return {
      success: true,
      data: {
        period: args.period || 'month',
        financial: {
          activeContracts,
          averageRevenuePercentage: totalRevenue._sum.revenuePercentage ? 
            (totalRevenue._sum.revenuePercentage / activeContracts) : 0,
          contractType: args.contractType || 'all'
        }
      }
    };
  }

  private async getSystemHealth(args: any, context: McpContext): Promise<McpResult> {
    if (context.userRole !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    const [
      totalUsers,
      activeUsers,
      totalContracts,
      activeContracts,
      pendingComplaints
    ] = await Promise.all([
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
  }

  private async manageUser(args: any, context: McpContext): Promise<McpResult> {
    if (context.userRole !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    const { action, userId, email } = args;
    let user;

    if (userId) {
      user = await db.user.findUnique({ where: { id: userId } });
    } else if (email) {
      user = await db.user.findUnique({ where: { email } });
    } else {
      return { success: false, error: 'Either userId or email is required' };
    }

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    switch (action) {
      case 'view':
        return {
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }
          }
        };

      case 'activate':
        await db.user.update({
          where: { id: user.id },
          data: { isActive: true }
        });
        return { success: true, data: { message: 'User activated successfully' } };

      case 'deactivate':
        await db.user.update({
          where: { id: user.id },
          data: { isActive: false }
        });
        return { success: true, data: { message: 'User deactivated successfully' } };

      default:
        return { success: false, error: 'Invalid action' };
    }
  }
}