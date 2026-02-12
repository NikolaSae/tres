// app/api/reports/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logEvent } from '@/actions/security/log-event';
import * as XLSX from 'xlsx';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportType, startDate, endDate, filters } = body;

    if (!reportType) {
      await logEvent({
        action: 'REPORT_GENERATION_FAILED',
        entityType: 'report',
        details: 'Missing report type',
        userId: session.user.id,
        severity: 'ERROR'
      });

      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      );
    }

    let reportData: any[] = [];
    let fileName = '';

    try {
      switch (reportType) {
        case 'financial':
          reportData = await generateFinancialReport(startDate, endDate, filters);
          fileName = `financial-report-${Date.now()}.xlsx`;
          break;

        case 'complaints':
          reportData = await generateComplaintsReport(startDate, endDate, filters);
          fileName = `complaints-report-${Date.now()}.xlsx`;
          break;

        case 'contracts':
          reportData = await generateContractsReport(startDate, endDate, filters);
          fileName = `contracts-report-${Date.now()}.xlsx`;
          break;

        case 'providers':
          reportData = await generateProvidersReport(filters);
          fileName = `providers-report-${Date.now()}.xlsx`;
          break;

        default:
          await logEvent({
            action: 'REPORT_GENERATION_FAILED',
            entityType: 'report',
            details: `Invalid report type: ${reportType}`,
            userId: session.user.id,
            severity: 'ERROR'
          });

          return NextResponse.json(
            { error: 'Invalid report type' },
            { status: 400 }
          );
      }

      // Generate Excel file
      const filePath = await createExcelFile(reportData, fileName);

      // Save report metadata to database
      const savedReport = await prisma.generatedReport.create({
        data: {
          name: fileName,
          reportType,
          fileUrl: `/reports/${fileName}`,
          generatedAt: new Date(),
        }
      });

      await logEvent({
        action: 'REPORT_GENERATED',
        entityType: 'report',
        entityId: savedReport.id,
        details: `Generated ${reportType} report`,
        userId: session.user.id,
        severity: 'INFO'
      });

      return NextResponse.json({
        success: true,
        reportId: savedReport.id,
        fileUrl: `/reports/${fileName}`,
        fileName,
      });

    } catch (error) {
      await logEvent({
        action: 'REPORT_GENERATION_FAILED',
        entityType: 'report',
        details: `Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        userId: session.user.id,
        severity: 'ERROR'
      });

      throw error;
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateFinancialReport(startDate: string, endDate: string, filters: any) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const vasTransactions = await prisma.vasTransaction.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
      ...(filters?.providerId && { providerId: filters.providerId }),
    },
    include: {
      provider: {
        select: {
          name: true,
        }
      },
      service: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  return vasTransactions.map(tx => ({
    'Provider': tx.provider.name,
    'Service': tx.service.name,
    'Date': tx.date.toISOString().split('T')[0],
    'Service Name': tx.serviceName,
    'Service Code': tx.serviceCode,
    'Group': tx.group,
    'Price': tx.price,
    'Quantity': tx.quantity,
    'Amount': tx.amount,
  }));
}

async function generateComplaintsReport(startDate: string, endDate: string, filters: any) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const complaints = await prisma.complaint.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      ...(filters?.status && { status: filters.status }),
      ...(filters?.providerId && { providerId: filters.providerId }),
    },
    include: {
      submittedBy: {
        select: {
          name: true,
          email: true,
        }
      },
      provider: {
        select: {
          name: true,
        }
      },
      service: {
        select: {
          name: true,
        }
      },
      assignedAgent: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return complaints.map(complaint => ({
    'ID': complaint.id,
    'Title': complaint.title,
    'Status': complaint.status,
    'Priority': complaint.priority,
    'Provider': complaint.provider?.name || 'N/A',
    'Service': complaint.service?.name || 'N/A',
    'Submitted By': complaint.submittedBy.name,
    'Assigned To': complaint.assignedAgent?.name || 'Unassigned',
    'Created At': complaint.createdAt.toISOString().split('T')[0],
    'Resolved At': complaint.resolvedAt ? complaint.resolvedAt.toISOString().split('T')[0] : 'N/A',
  }));
}

async function generateContractsReport(startDate: string, endDate: string, filters: any) {
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const contracts = await prisma.contract.findMany({
    where: {
      ...(start && end && {
        OR: [
          {
            startDate: {
              gte: start,
              lte: end,
            }
          },
          {
            endDate: {
              gte: start,
              lte: end,
            }
          }
        ]
      }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
    },
    include: {
      provider: {
        select: {
          name: true,
        }
      },
      humanitarianOrg: {
        select: {
          name: true,
        }
      },
      parkingService: {
        select: {
          name: true,
        }
      },
      createdBy: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return contracts.map(contract => ({
    'Contract Number': contract.contractNumber,
    'Name': contract.name,
    'Type': contract.type,
    'Status': contract.status,
    'Entity': contract.provider?.name || contract.humanitarianOrg?.name || contract.parkingService?.name || 'N/A',
    'Revenue %': contract.revenuePercentage,
    'Start Date': contract.startDate.toISOString().split('T')[0],
    'End Date': contract.endDate.toISOString().split('T')[0],
    'Created By': contract.createdBy.name,
    'Created At': contract.createdAt.toISOString().split('T')[0],
  }));
}

async function generateProvidersReport(filters: any) {
  const providers = await prisma.provider.findMany({
    where: {
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      _count: {
        select: {
          contracts: true,
          vasServices: true,
          bulkServices: true,
          complaints: true,
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return providers.map(provider => ({
    'Name': provider.name,
    'Contact': provider.contactName || 'N/A',
    'Email': provider.email || 'N/A',
    'Phone': provider.phone || 'N/A',
    'Active': provider.isActive ? 'Yes' : 'No',
    'Contracts': provider._count.contracts,
    'VAS Services': provider._count.vasServices,
    'Bulk Services': provider._count.bulkServices,
    'Complaints': provider._count.complaints,
    'Created At': provider.createdAt.toISOString().split('T')[0],
  }));
}

async function createExcelFile(data: any[], fileName: string): Promise<string> {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'public', 'reports');
  const filePath = path.join(reportsDir, fileName);

  // Ensure directory exists
  const fs = require('fs');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write file
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  await writeFile(filePath, buffer);

  return filePath;
}