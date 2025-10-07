// lib/mcp/write-tools.ts
import { db } from '@/lib/db';
import type { McpContext, McpResult, McpTool } from './types';
import { logQuery } from './query-logger';

export interface WriteTool {
  name: string;
  description: string;
  inputSchema: any;
  requiredRole?: string[];
}

export class WriteOperations {
  
  // Dohvati write tools na osnovu uloge
  getWriteToolsForRole(role: string): WriteTool[] {
    const tools: WriteTool[] = [];

    // Agent i više mogu kreirati reklamacije
    if (['ADMIN', 'MANAGER', 'AGENT'].includes(role)) {
      tools.push(
        {
          name: 'create_complaint',
          description: 'Create a new complaint',
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT'],
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', minLength: 5 },
              description: { type: 'string', minLength: 10 },
              priority: { type: 'number', minimum: 1, maximum: 5 },
              providerId: { type: 'string' },
              serviceId: { type: 'string' },
              category: { type: 'string' },
              financialImpact: { type: 'number', minimum: 0 }
            },
            required: ['title', 'description', 'priority', 'providerId']
          }
        },
        {
          name: 'update_complaint',
          description: 'Update an existing complaint',
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT'],
          inputSchema: {
            type: 'object',
            properties: {
              complaintId: { type: 'string' },
              status: { type: 'string', enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REJECTED'] },
              priority: { type: 'number', minimum: 1, maximum: 5 },
              assignedAgentId: { type: 'string' },
              internalNotes: { type: 'string' },
              resolution: { type: 'string' }
            },
            required: ['complaintId']
          }
        },
        {
          name: 'add_complaint_comment',
          description: 'Add a comment to a complaint',
          requiredRole: ['ADMIN', 'MANAGER', 'AGENT'],
          inputSchema: {
            type: 'object',
            properties: {
              complaintId: { type: 'string' },
              content: { type: 'string', minLength: 1 },
              isInternal: { type: 'boolean', default: false }
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
          description: 'Create a new contract',
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 3 },
              contractNumber: { type: 'string' },
              type: { type: 'string', enum: ['PROVIDER', 'HUMANITARIAN', 'PARKING', 'BULK'] },
              status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'EXPIRED'], default: 'PENDING' },
              providerId: { type: 'string' },
              humanitarianOrgId: { type: 'string' },
              parkingServiceId: { type: 'string' },
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' },
              revenuePercentage: { type: 'number', minimum: 0, maximum: 100 },
              description: { type: 'string' }
            },
            required: ['name', 'type', 'startDate', 'endDate']
          }
        },
        {
          name: 'update_contract',
          description: 'Update an existing contract',
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              contractId: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'EXPIRED', 'RENEWAL_IN_PROGRESS', 'TERMINATED'] },
              endDate: { type: 'string', format: 'date' },
              revenuePercentage: { type: 'number', minimum: 0, maximum: 100 },
              description: { type: 'string' },
              notes: { type: 'string' }
            },
            required: ['contractId']
          }
        },
        {
          name: 'create_provider',
          description: 'Create a new provider',
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 2 },
              contactName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              address: { type: 'string' },
              pib: { type: 'string' },
              registrationNumber: { type: 'string' },
              isActive: { type: 'boolean', default: true }
            },
            required: ['name', 'email']
          }
        },
        {
          name: 'update_provider',
          description: 'Update an existing provider',
          requiredRole: ['ADMIN', 'MANAGER'],
          inputSchema: {
            type: 'object',
            properties: {
              providerId: { type: 'string' },
              name: { type: 'string' },
              contactName: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              address: { type: 'string' },
              isActive: { type: 'boolean' }
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
          description: 'Delete a contract (soft delete)',
          requiredRole: ['ADMIN'],
          inputSchema: {
            type: 'object',
            properties: {
              contractId: { type: 'string' },
              reason: { type: 'string', minLength: 10 }
            },
            required: ['contractId', 'reason']
          }
        },
        {
          name: 'bulk_update_contracts',
          description: 'Update multiple contracts at once',
          requiredRole: ['ADMIN'],
          inputSchema: {
            type: 'object',
            properties: {
              contractIds: { type: 'array', items: { type: 'string' } },
              updates: { 
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  revenuePercentage: { type: 'number' }
                }
              }
            },
            required: ['contractIds', 'updates']
          }
        },
        {
          name: 'create_humanitarian_org',
          description: 'Create a new humanitarian organization',
          requiredRole: ['ADMIN'],
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 3 },
              shortNumber: { type: 'string' },
              accountNumber: { type: 'string' },
              pib: { type: 'string' },
              registrationNumber: { type: 'string' },
              bank: { type: 'string' },
              mission: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              isActive: { type: 'boolean', default: true }
            },
            required: ['name', 'shortNumber']
          }
        }
      );
    }

    return tools;
  }

  // Execute write operations
  async executeWriteTool(toolName: string, args: any, context: McpContext): Promise<McpResult> {
    try {
      // Log write operation
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
      const comment = await db.complaintComment.create({
        data: {
          content: args.content,
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
          pib: args.pib,
          registrationNumber: args.registrationNumber,
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