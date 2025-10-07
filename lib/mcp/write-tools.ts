// lib/mcp/write-tools.ts - Ažurirano
import { db } from '@/lib/db';
import type { McpContext, McpResult, McpTool } from './types';
import { logQuery } from './query-logger';

/**
 * Write Operations klasa - Upravlja svim write (CREATE, UPDATE, DELETE) operacijama
 */
export class WriteOperations {
  
  /**
   * Vraća write alate dostupne za datu ulogu
   */
  getWriteToolsForRole(role: string): Omit<McpTool, 'category'>[] {
    const tools: Omit<McpTool, 'category'>[] = [];

    // Agent i više mogu kreirati i ažurirati reklamacije
    if (['ADMIN', 'MANAGER', 'AGENT'].includes(role)) {
      tools.push(
        {
          name: 'create_complaint',
          description: 'Create a new complaint about a service or provider',
          examples: [
            'Kreiraj žalbu na Telekom zbog loše usluge',
            'Nova reklamacija za MTS',
            'Prijavi problem sa humanitarnom organizacijom'
          ],
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT'],
          inputSchema: {
            type: 'object',
            properties: {
              title: { 
                type: 'string', 
                minLength: 5,
                description: 'Brief title of the complaint'
              },
              description: { 
                type: 'string', 
                minLength: 10,
                description: 'Detailed description of the issue'
              },
              priority: { 
                type: 'number', 
                minimum: 1, 
                maximum: 5,
                default: 3,
                description: '1 = highest priority, 5 = lowest'
              },
              providerId: { 
                type: 'string',
                description: 'ID of the provider being complained about'
              },
              serviceId: { 
                type: 'string',
                description: 'Optional: specific service ID'
              },
              category: { 
                type: 'string',
                description: 'Complaint category'
              },
              financialImpact: { 
                type: 'number', 
                minimum: 0,
                description: 'Estimated financial impact'
              }
            },
            required: ['title', 'description', 'priority', 'providerId']
          }
        },
        {
          name: 'update_complaint',
          description: 'Update status, priority, or assignment of an existing complaint',
          examples: [
            'Promeni status žalbe u "Rešeno"',
            'Dodeli žalbu agentu',
            'Ažuriraj prioritet na visok'
          ],
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT'],
          inputSchema: {
            type: 'object',
            properties: {
              complaintId: { 
                type: 'string',
                description: 'ID of the complaint to update'
              },
              status: { 
                type: 'string', 
                enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED'],
                description: 'New status'
              },
              priority: { 
                type: 'number', 
                minimum: 1, 
                maximum: 5,
                description: 'New priority level'
              },
              assignedAgentId: { 
                type: 'string',
                description: 'Agent to assign this complaint to'
              },
              internalNotes: { 
                type: 'string',
                description: 'Internal notes (not visible to customer)'
              },
              resolution: { 
                type: 'string',
                description: 'Resolution description if closing complaint'
              }
            },
            required: ['complaintId']
          }
        },
        {
          name: 'add_complaint_comment',
          description: 'Add a comment to an existing complaint',
          examples: [
            'Dodaj komentar na žalbu',
            'Interno obavestenje za tim',
            'Odgovor za klijenta'
          ],
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT'],
          inputSchema: {
            type: 'object',
            properties: {
              complaintId: { 
                type: 'string',
                description: 'Complaint ID'
              },
              content: { 
                type: 'string', 
                minLength: 1,
                description: 'Comment text'
              },
              isInternal: { 
                type: 'boolean', 
                default: false,
                description: 'True if this is internal comment only'
              }
            },
            required: ['complaintId', 'content']
          }
        }
      );
    }

    // Manager i Admin mogu kreirati/ažurirati ugovore
    if (['ADMIN', 'MANAGER'].includes(role)) {
      tools.push(
        {
          name: 'create_contract',
          description: 'Create a new contract with a provider, humanitarian org, or parking service',
          examples: [
            'Kreiraj novi ugovor sa Telekomom',
            'Dodaj humanitarni ugovor za Crveni krst',
            'Novi parking ugovor'
          ],
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                minLength: 3,
                description: 'Contract name'
              },
              contractNumber: { 
                type: 'string',
                description: 'Unique contract number'
              },
              type: { 
                type: 'string', 
                enum: ['PROVIDER', 'HUMANITARIAN', 'PARKING', 'BULK'],
                description: 'Type of contract'
              },
              status: { 
                type: 'string', 
                enum: ['ACTIVE', 'PENDING', 'EXPIRED'], 
                default: 'PENDING',
                description: 'Initial status'
              },
              providerId: { 
                type: 'string',
                description: 'Provider ID (required for PROVIDER type)'
              },
              humanitarianOrgId: { 
                type: 'string',
                description: 'Humanitarian org ID (required for HUMANITARIAN type)'
              },
              parkingServiceId: { 
                type: 'string',
                description: 'Parking service ID (required for PARKING type)'
              },
              startDate: { 
                type: 'string', 
                format: 'date',
                description: 'Contract start date (YYYY-MM-DD)'
              },
              endDate: { 
                type: 'string', 
                format: 'date',
                description: 'Contract end date (YYYY-MM-DD)'
              },
              revenuePercentage: { 
                type: 'number', 
                minimum: 0, 
                maximum: 100,
                description: 'Revenue share percentage'
              },
              description: { 
                type: 'string',
                description: 'Optional contract description'
              }
            },
            required: ['name', 'type', 'startDate', 'endDate']
          }
        },
        {
          name: 'update_contract',
          description: 'Update an existing contract details',
          examples: [
            'Ažuriraj status ugovora na "Aktivan"',
            'Promeni procenat prihoda',
            'Produži datum isteka'
          ],
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              contractId: { 
                type: 'string',
                description: 'Contract ID to update'
              },
              name: { 
                type: 'string',
                description: 'New contract name'
              },
              status: { 
                type: 'string', 
                enum: ['ACTIVE', 'PENDING', 'EXPIRED', 'RENEWAL_IN_PROGRESS', 'TERMINATED'],
                description: 'New status'
              },
              endDate: { 
                type: 'string', 
                format: 'date',
                description: 'New end date'
              },
              revenuePercentage: { 
                type: 'number', 
                minimum: 0, 
                maximum: 100,
                description: 'New revenue percentage'
              },
              description: { 
                type: 'string',
                description: 'Updated description'
              },
              notes: { 
                type: 'string',
                description: 'Additional notes'
              }
            },
            required: ['contractId']
          }
        },
        {
          name: 'create_provider',
          description: 'Create a new service provider in the system',
          examples: [
            'Dodaj novog provajdera "Novi Telekom"',
            'Kreiraj provajder sa email kontaktom',
            'Registruj novu kompaniju'
          ],
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                minLength: 2,
                description: 'Provider name'
              },
              contactName: { 
                type: 'string',
                description: 'Contact person name'
              },
              email: { 
                type: 'string', 
                format: 'email',
                description: 'Contact email'
              },
              phone: { 
                type: 'string',
                description: 'Contact phone'
              },
              address: { 
                type: 'string',
                description: 'Provider address'
              },
              pib: { 
                type: 'string',
                description: 'Tax ID (PIB)'
              },
              registrationNumber: { 
                type: 'string',
                description: 'Company registration number'
              },
              isActive: { 
                type: 'boolean', 
                default: true,
                description: 'Is provider active?'
              }
            },
            required: ['name', 'email']
          }
        },
        {
          name: 'update_provider',
          description: 'Update existing provider information',
          examples: [
            'Ažuriraj email provajdera',
            'Deaktiviraj provajder',
            'Promeni kontakt telefon'
          ],
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              providerId: { 
                type: 'string',
                description: 'Provider ID to update'
              },
              name: { 
                type: 'string',
                description: 'New name'
              },
              contactName: { 
                type: 'string',
                description: 'New contact name'
              },
              email: { 
                type: 'string', 
                format: 'email',
                description: 'New email'
              },
              phone: { 
                type: 'string',
                description: 'New phone'
              },
              address: { 
                type: 'string',
                description: 'New address'
              },
              isActive: { 
                type: 'boolean',
                description: 'Active status'
              }
            },
            required: ['providerId']
          }
        }
      );
    }

    // Admin-only operacije
    if (role === 'ADMIN') {
      tools.push(
        {
          name: 'delete_contract',
          description: 'Soft delete a contract (sets status to TERMINATED)',
          examples: [
            'Obriši ugovor sa obrazloženjem',
            'Terminiraj ugovor zbog neispunjenja uslova'
          ],
          requiredRole: ['ADMIN'],
          inputSchema: {
            type: 'object',
            properties: {
              contractId: { 
                type: 'string',
                description: 'Contract ID to delete'
              },
              reason: { 
                type: 'string', 
                minLength: 10,
                description: 'Reason for deletion (required for audit)'
              }
            },
            required: ['contractId', 'reason']
          }
        },
        {
          name: 'bulk_update_contracts',
          description: 'Update multiple contracts at once (batch operation)',
          examples: [
            'Ažuriraj sve ugovore na 15% prihoda',
            'Postavi status svih na ACTIVE'
          ],
          requiredRole: ['ADMIN'],
          inputSchema: {
            type: 'object',
            properties: {
              contractIds: { 
                type: 'array', 
                items: { type: 'string' },
                description: 'Array of contract IDs'
              },
              updates: { 
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  revenuePercentage: { type: 'number' }
                },
                description: 'Fields to update'
              }
            },
            required: ['contractIds', 'updates']
          }
        },
        {
          name: 'create_humanitarian_org',
          description: 'Create a new humanitarian organization',
          examples: [
            'Dodaj Crveni krst kao humanitarnu organizaciju',
            'Registruj novu humanitarnu org sa kratkim brojem'
          ],
          requiredRole: ['ADMIN'],
          inputSchema: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                minLength: 3,
                description: 'Organization name'
              },
              shortNumber: { 
                type: 'string',
                description: 'Short SMS number'
              },
              accountNumber: { 
                type: 'string',
                description: 'Bank account number'
              },
              pib: { 
                type: 'string',
                description: 'Tax ID'
              },
              registrationNumber: { 
                type: 'string',
                description: 'Registration number'
              },
              bank: { 
                type: 'string',
                description: 'Bank name'
              },
              mission: { 
                type: 'string',
                description: 'Organization mission statement'
              },
              email: { 
                type: 'string', 
                format: 'email',
                description: 'Contact email'
              },
              phone: { 
                type: 'string',
                description: 'Contact phone'
              },
              isActive: { 
                type: 'boolean', 
                default: true,
                description: 'Is organization active?'
              }
            },
            required: ['name', 'shortNumber']
          }
        }
      );
    }

    return tools;
  }

  /**
   * Izvršava write operaciju
   */
  async executeWriteTool(toolName: string, args: any, context: McpContext): Promise<McpResult> {
    try {
      // Log write operacije
      await logQuery(context.userId, `WRITE_${toolName}`, args);

      switch (toolName) {
        case 'create_complaint':
          return await this.createComplaint(args, context);
        case 'update_complaint':
          return await this.updateComplaint(args, context);
        case 'add_complaint_comment':
          return await this.addComplaintComment(args, context);
        case 'create_contract':
          return await this.createContract(args, context);
        case 'update_contract':
          return await this.updateContract(args, context);
        case 'create_provider':
          return await this.createProvider(args, context);
        case 'update_provider':
          return await this.updateProvider(args, context);
        case 'delete_contract':
          return await this.deleteContract(args, context);
        case 'bulk_update_contracts':
          return await this.bulkUpdateContracts(args, context);
        case 'create_humanitarian_org':
          return await this.createHumanitarianOrg(args, context);
        default:
          return { success: false, error: `Unknown write tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`MCP Write Tool Error [${toolName}]:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ============================================
  // COMPLAINT OPERATIONS
  // ============================================

  private async createComplaint(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const complaint = await db.complaint.create({
        data: {
          title: args.title,
          description: args.description,
          priority: args.priority,
          status: 'NEW',
          category: args.category,
          financialImpact: args.financialImpact,
          providerId: args.providerId,
          serviceId: args.serviceId,
          submittedById: context.userId
        },
        include: {
          provider: { select: { name: true } },
          service: { select: { name: true } }
        }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'COMPLAINT_CREATED',
          entityType: 'complaint',
          entityId: complaint.id,
          details: JSON.stringify({ title: args.title }),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { complaint, message: 'Complaint created successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to create complaint: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async updateComplaint(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      // Check if user has permission to update this complaint
      const existing = await db.complaint.findUnique({
        where: { id: args.complaintId }
      });

      if (!existing) {
        return { success: false, error: 'Complaint not found' };
      }

      // Agents can only update their assigned complaints
      if (context.userRole === 'AGENT' && 
          existing.assignedAgentId !== context.userId && 
          existing.submittedById !== context.userId) {
        return { success: false, error: 'You can only update your own or assigned complaints' };
      }

      const updateData: any = {};
      if (args.status) updateData.status = args.status;
      if (args.priority !== undefined) updateData.priority = args.priority;
      if (args.assignedAgentId) updateData.assignedAgentId = args.assignedAgentId;
      if (args.internalNotes) updateData.internalNotes = args.internalNotes;
      if (args.resolution) updateData.resolution = args.resolution;

      const complaint = await db.complaint.update({
        where: { id: args.complaintId },
        data: updateData,
        include: {
          provider: { select: { name: true } },
          assignedAgent: { select: { name: true } }
        }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'COMPLAINT_UPDATED',
          entityType: 'complaint',
          entityId: complaint.id,
          details: JSON.stringify(updateData),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { complaint, message: 'Complaint updated successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to update complaint: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async addComplaintComment(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER', 'AGENT'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const comment = await db.comment.create({
        data: {
          text: args.content,
          isInternal: args.isInternal || false,
          complaintId: args.complaintId,
          userId: context.userId
        },
        include: {
          user: { select: { name: true, email: true } }
        }
      });

      return {
        success: true,
        data: { comment, message: 'Comment added successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // ============================================
  // CONTRACT OPERATIONS
  // ============================================

  private async createContract(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      // Validate entity existence
      if (args.providerId) {
        const provider = await db.provider.findUnique({ where: { id: args.providerId } });
        if (!provider) return { success: false, error: 'Provider not found' };
      }

      if (args.humanitarianOrgId) {
        const org = await db.humanitarianOrg.findUnique({ where: { id: args.humanitarianOrgId } });
        if (!org) return { success: false, error: 'Humanitarian organization not found' };
      }

      const contract = await db.contract.create({
        data: {
          name: args.name,
          contractNumber: args.contractNumber,
          type: args.type,
          status: args.status || 'PENDING',
          startDate: new Date(args.startDate),
          endDate: new Date(args.endDate),
          revenuePercentage: args.revenuePercentage,
          description: args.description,
          providerId: args.providerId,
          humanitarianOrgId: args.humanitarianOrgId,
          parkingServiceId: args.parkingServiceId,
          createdById: context.userId
        },
        include: {
          provider: { select: { name: true } },
          humanitarianOrg: { select: { name: true } }
        }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'CONTRACT_CREATED',
          entityType: 'contract',
          entityId: contract.id,
          details: JSON.stringify({ name: args.name, type: args.type }),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { contract, message: 'Contract created successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to create contract: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async updateContract(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const updateData: any = {};
      if (args.name) updateData.name = args.name;
      if (args.status) updateData.status = args.status;
      if (args.endDate) updateData.endDate = new Date(args.endDate);
      if (args.revenuePercentage !== undefined) updateData.revenuePercentage = args.revenuePercentage;
      if (args.description) updateData.description = args.description;
      if (args.notes) updateData.notes = args.notes;

      const contract = await db.contract.update({
        where: { id: args.contractId },
        data: updateData,
        include: {
          provider: { select: { name: true } },
          humanitarianOrg: { select: { name: true } }
        }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'CONTRACT_UPDATED',
          entityType: 'contract',
          entityId: contract.id,
          details: JSON.stringify(updateData),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { contract, message: 'Contract updated successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to update contract: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async deleteContract(args: any, context: McpContext): Promise<McpResult> {
    if (context.userRole !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    try {
      // Soft delete - update status instead of actual delete
      const contract = await db.contract.update({
        where: { id: args.contractId },
        data: { 
          status: 'TERMINATED',
          notes: `Deleted by ${context.userId}. Reason: ${args.reason}`
        }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'CONTRACT_DELETED',
          entityType: 'contract',
          entityId: contract.id,
          details: JSON.stringify({ reason: args.reason }),
          severity: 'WARNING',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { message: 'Contract deleted (soft delete) successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to delete contract: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async bulkUpdateContracts(args: any, context: McpContext): Promise<McpResult> {
    if (context.userRole !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    try {
      const results = await db.contract.updateMany({
        where: { id: { in: args.contractIds } },
        data: args.updates
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'CONTRACT_BULK_UPDATE',
          entityType: 'contract',
          details: JSON.stringify({ 
            count: results.count, 
            updates: args.updates 
          }),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { 
          updated: results.count, 
          message: `${results.count} contracts updated successfully` 
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to bulk update contracts: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // ============================================
  // PROVIDER OPERATIONS
  // ============================================

  private async createProvider(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const provider = await db.provider.create({
        data: {
          name: args.name,
          contactName: args.contactName,
          email: args.email,
          phone: args.phone,
          address: args.address,
          isActive: args.isActive !== undefined ? args.isActive : true
        }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'PROVIDER_CREATED',
          entityType: 'provider',
          entityId: provider.id,
          details: JSON.stringify({ name: args.name }),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { provider, message: 'Provider created successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to create provider: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async updateProvider(args: any, context: McpContext): Promise<McpResult> {
    if (!['ADMIN', 'MANAGER'].includes(context.userRole)) {
      return { success: false, error: 'Insufficient permissions' };
    }

    try {
      const updateData: any = {};
      if (args.name) updateData.name = args.name;
      if (args.contactName) updateData.contactName = args.contactName;
      if (args.email) updateData.email = args.email;
      if (args.phone) updateData.phone = args.phone;
      if (args.address) updateData.address = args.address;
      if (args.isActive !== undefined) updateData.isActive = args.isActive;

      const provider = await db.provider.update({
        where: { id: args.providerId },
        data: updateData
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'PROVIDER_UPDATED',
          entityType: 'provider',
          entityId: provider.id,
          details: JSON.stringify(updateData),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { provider, message: 'Provider updated successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to update provider: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // ============================================
  // HUMANITARIAN ORG OPERATIONS
  // ============================================

  private async createHumanitarianOrg(args: any, context: McpContext): Promise<McpResult> {
    if (context.userRole !== 'ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    try {
      const org = await db.humanitarianOrg.create({
        data: {
          name: args.name,
          shortNumber: args.shortNumber,
          accountNumber: args.accountNumber,
          pib: args.pib,
          registrationNumber: args.registrationNumber,
          bank: args.bank,
          mission: args.mission,
          email: args.email,
          phone: args.phone,
          isActive: args.isActive !== undefined ? args.isActive : true
        }
      });

      // Log activity
      await db.activityLog.create({
        data: {
          action: 'HUMANITARIAN_ORG_CREATED',
          entityType: 'humanitarian_org',
          entityId: org.id,
          details: JSON.stringify({ name: args.name, shortNumber: args.shortNumber }),
          severity: 'INFO',
          userId: context.userId
        }
      });

      return {
        success: true,
        data: { org, message: 'Humanitarian organization created successfully' }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to create humanitarian organization: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const writeOperations = new WriteOperations();