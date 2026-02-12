// mcp-server/src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const server = new Server(
  {
    name: 'contract-management-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools: Tool[] = [
  {
    name: 'get_contracts',
    description: 'Dohvata ugovore na osnovu kriterijuma',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ACTIVE', 'EXPIRED', 'PENDING', 'RENEWAL_IN_PROGRESS', 'TERMINATED'],
          description: 'Status ugovora'
        },
        type: {
          type: 'string',
          enum: ['PROVIDER', 'HUMANITARIAN', 'PARKING', 'BULK'],
          description: 'Tip ugovora'
        },
        limit: {
          type: 'number',
          description: 'Maksimalan broj rezultata (default: 10)'
        }
      }
    }
  },
  {
    name: 'get_contract_details',
    description: 'Dohvata detalje specifičnog ugovora',
    inputSchema: {
      type: 'object',
      properties: {
        contractId: {
          type: 'string',
          description: 'ID ugovora'
        }
      },
      required: ['contractId']
    }
  },
  {
    name: 'get_complaints',
    description: 'Dohvata žalbe na osnovu kriterijuma',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED'],
          description: 'Status žalbe'
        },
        priority: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Prioritet žalbe (1-5)'
        },
        limit: {
          type: 'number',
          description: 'Maksimalan broj rezultata (default: 10)'
        }
      }
    }
  },
  {
    name: 'get_providers',
    description: 'Dohvata provajdere',
    inputSchema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: 'Da li je provajder aktivan'
        },
        limit: {
          type: 'number',
          description: 'Maksimalan broj rezultata (default: 10)'
        }
      }
    }
  },
  {
    name: 'get_services',
    description: 'Dohvata servise',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['VAS', 'BULK', 'HUMANITARIAN', 'PARKING'],
          description: 'Tip servisa'
        },
        isActive: {
          type: 'boolean',
          description: 'Da li je servis aktivan'
        },
        limit: {
          type: 'number',
          description: 'Maksimalan broj rezultata (default: 10)'
        }
      }
    }
  },
  {
    name: 'get_financial_summary',
    description: 'Dohvata finansijski pregled',
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Početni datum (YYYY-MM-DD)'
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'Završni datum (YYYY-MM-DD)'
        },
        providerId: {
          type: 'string',
          description: 'ID provajdera (opciono)'
        }
      }
    }
  },
  {
    name: 'search_database',
    description: 'Opšta pretraga kroz bazu podataka',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Termin za pretragu'
        },
        table: {
          type: 'string',
          enum: ['contracts', 'complaints', 'providers', 'services', 'users'],
          description: 'Tabela za pretragu'
        },
        limit: {
          type: 'number',
          description: 'Maksimalan broj rezultata (default: 10)'
        }
      },
      required: ['query']
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs = {} } = request.params;
  const args = rawArgs as Record<string, any>;

  try {
    switch (name) {
      case 'get_contracts':
        const contractsWhere: any = {};
        if (args.status) contractsWhere.status = args.status;
        if (args.type) contractsWhere.type = args.type;

        const contracts = await prisma.contract.findMany({
          where: contractsWhere,
          take: args.limit || 10,
          include: {
            provider: true,
            humanitarianOrg: true,
            parkingService: true,
            createdBy: { select: { name: true, email: true } },
            services: {
              include: {
                service: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: contracts,
              count: contracts.length
            }, null, 2)
          }]
        };

      case 'get_contract_details':
        const contract = await prisma.contract.findUnique({
          where: { id: args.contractId },
          include: {
            provider: true,
            humanitarianOrg: true,
            parkingService: true,
            createdBy: { select: { name: true, email: true } },
            lastModifiedBy: { select: { name: true, email: true } },
            services: {
              include: {
                service: true
              }
            },
            attachments: true,
            reminders: true,
            renewals: true,
            humanitarianRenewals: true
          }
        });

        if (!contract) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Ugovor nije pronađen'
              })
            }]
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: contract
            }, null, 2)
          }]
        };

      case 'get_complaints':
        const complaintsWhere: any = {};
        if (args.status) complaintsWhere.status = args.status;
        if (args.priority) complaintsWhere.priority = args.priority;

        const complaints = await prisma.complaint.findMany({
          where: complaintsWhere,
          take: args.limit || 10,
          include: {
            service: true,
            provider: true,
            humanitarianOrg: true,
            parkingService: true,
            submittedBy: { select: { name: true, email: true } },
            assignedAgent: { select: { name: true, email: true } },
            comments: {
              take: 3,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: complaints,
              count: complaints.length
            }, null, 2)
          }]
        };

      case 'get_providers':
        const providersWhere: any = {};
        if (args.isActive !== undefined) providersWhere.isActive = args.isActive;

        const providers = await prisma.provider.findMany({
          where: providersWhere,
          take: args.limit || 10,
          include: {
            contracts: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
                endDate: true
              }
            },
            complaints: {
              where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true
              }
            }
          }
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: providers,
              count: providers.length
            }, null, 2)
          }]
        };

      case 'get_services':
        const servicesWhere: any = {};
        if (args.type) servicesWhere.type = args.type;
        if (args.isActive !== undefined) servicesWhere.isActive = args.isActive;

        const services = await prisma.service.findMany({
          where: servicesWhere,
          take: args.limit || 10,
          include: {
            contracts: {
              include: {
                contract: {
                  select: {
                    name: true,
                    status: true,
                    provider: { select: { name: true } },
                    humanitarianOrg: { select: { name: true } }
                  }
                }
              }
            }
          }
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: services,
              count: services.length
            }, null, 2)
          }]
        };

      case 'get_financial_summary':
        const startDate = args.startDate ? new Date(String(args.startDate)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = args.endDate ? new Date(String(args.endDate)) : new Date();

        // VAS transactions summary
        const vasTransactionsWhere: any = {
          date: {
            gte: startDate,
            lte: endDate
          }
        };
        if (args.providerId) vasTransactionsWhere.providerId = args.providerId;

        const vasTransactions = await prisma.vasTransaction.findMany({
          where: vasTransactionsWhere,
          include: {
            provider: { select: { name: true } },
            service: { select: { name: true } }
          }
        });

        const vasTotal = vasTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Parking transactions summary
        const parkingTransactionsWhere: any = {
          date: {
            gte: startDate,
            lte: endDate
          }
        };

        const parkingTransactions = await prisma.parkingTransaction.findMany({
          where: parkingTransactionsWhere,
          include: {
            parkingService: { select: { name: true } },
            service: { select: { name: true } }
          }
        });

        const parkingTotal = parkingTransactions.reduce((sum, t) => sum + t.amount, 0);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: {
                period: { startDate, endDate },
                summary: {
                  vasTransactions: {
                    count: vasTransactions.length,
                    total: vasTotal
                  },
                  parkingTransactions: {
                    count: parkingTransactions.length,
                    total: parkingTotal
                  },
                  grandTotal: vasTotal + parkingTotal
                },
                details: {
                  vasTransactions: vasTransactions.slice(0, 10),
                  parkingTransactions: parkingTransactions.slice(0, 10)
                }
              }
            }, null, 2)
          }]
        };

      case 'search_database':
        const searchQuery = String(args.query).toLowerCase();
        let searchResults: any = {};

        if (!args.table || args.table === 'contracts') {
          const contractSearch = await prisma.contract.findMany({
            where: {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { contractNumber: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            take: args.limit || 10,
            include: {
              provider: { select: { name: true } },
              humanitarianOrg: { select: { name: true } },
              parkingService: { select: { name: true } }
            }
          });
          searchResults.contracts = contractSearch;
        }

        if (!args.table || args.table === 'complaints') {
          const complaintSearch = await prisma.complaint.findMany({
            where: {
              OR: [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            take: args.limit || 10,
            include: {
              submittedBy: { select: { name: true } },
              provider: { select: { name: true } }
            }
          });
          searchResults.complaints = complaintSearch;
        }

        if (!args.table || args.table === 'providers') {
          const providerSearch = await prisma.provider.findMany({
            where: {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { contactName: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } }
              ]
            },
            take: args.limit || 10
          });
          searchResults.providers = providerSearch;
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              query: searchQuery,
              data: searchResults
            }, null, 2)
          }]
        };

      default:
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Nepoznat tool: ${name}`
            })
          }]
        };
    }
  } catch (error: unknown) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }]
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server je pokrenut');
}

runServer().catch(console.error);