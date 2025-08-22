// /utils/excel-generator.ts
import ExcelJS from 'exceljs';
import { Complaint, Comment } from '@prisma/client';
import { ComplaintWithRelations } from '@/lib/types/complaint-types';

type ExportOptions = {
  includeComments?: boolean;
  includeStatusHistory?: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
};

export async function generateComplaintExcel(
  complaints: ComplaintWithRelations[],
  options: ExportOptions = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Complaints');
  
  // Set up headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Service', key: 'service', width: 20 },
    { header: 'Product', key: 'product', width: 20 },
    { header: 'Provider', key: 'provider', width: 20 },
    { header: 'Financial Impact', key: 'financialImpact', width: 15 },
    { header: 'Submitted By', key: 'submittedBy', width: 20 },
    { header: 'Assigned To', key: 'assignedTo', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 20 },
    { header: 'Last Updated', key: 'updatedAt', width: 20 },
    { header: 'Resolved At', key: 'resolvedAt', width: 20 },
    { header: 'Description', key: 'description', width: 50 },
  ];
  
  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  
  // Add data
  complaints.forEach(complaint => {
    worksheet.addRow({
      id: complaint.id,
      title: complaint.title,
      status: complaint.status,
      priority: complaint.priority,
      service: complaint.service?.name || 'N/A',
      product: complaint.product?.name || 'N/A',
      provider: complaint.provider?.name || 'N/A',
      financialImpact: complaint.financialImpact || 0,
      submittedBy: complaint.submittedBy?.name || 'Unknown',
      assignedTo: complaint.assignedAgent?.name || 'Unassigned',
      createdAt: complaint.createdAt.toLocaleString(),
      updatedAt: complaint.updatedAt.toLocaleString(),
      resolvedAt: complaint.resolvedAt ? complaint.resolvedAt.toLocaleString() : 'N/A',
      description: complaint.description,
    });
  });
  
  // Add comments if requested
  if (options.includeComments && complaints.some(c => c.comments && c.comments.length > 0)) {
    const commentsSheet = workbook.addWorksheet('Comments');
    
    commentsSheet.columns = [
      { header: 'Complaint ID', key: 'complaintId', width: 15 },
      { header: 'Complaint Title', key: 'complaintTitle', width: 30 },
      { header: 'Comment By', key: 'user', width: 20 },
      { header: 'Comment Date', key: 'date', width: 20 },
      { header: 'Internal Only', key: 'isInternal', width: 15 },
      { header: 'Comment', key: 'text', width: 50 },
    ];
    
    commentsSheet.getRow(1).font = { bold: true };
    commentsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    complaints.forEach(complaint => {
      if (complaint.comments && complaint.comments.length > 0) {
        complaint.comments.forEach(comment => {
          commentsSheet.addRow({
            complaintId: complaint.id,
            complaintTitle: complaint.title,
            user: comment.user?.name || 'Unknown',
            date: comment.createdAt.toLocaleString(),
            isInternal: comment.isInternal ? 'Yes' : 'No',
            text: comment.text,
          });
        });
      }
    });
  }
  
  // Add status history if requested
  if (options.includeStatusHistory && complaints.some(c => c.statusHistory && c.statusHistory.length > 0)) {
    const statusSheet = workbook.addWorksheet('Status History');
    
    statusSheet.columns = [
      { header: 'Complaint ID', key: 'complaintId', width: 15 },
      { header: 'Complaint Title', key: 'complaintTitle', width: 30 },
      { header: 'Previous Status', key: 'previousStatus', width: 15 },
      { header: 'New Status', key: 'newStatus', width: 15 },
      { header: 'Changed By', key: 'changedBy', width: 20 },
      { header: 'Changed At', key: 'changedAt', width: 20 },
      { header: 'Notes', key: 'notes', width: 50 },
    ];
    
    statusSheet.getRow(1).font = { bold: true };
    statusSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    complaints.forEach(complaint => {
      if (complaint.statusHistory && complaint.statusHistory.length > 0) {
        complaint.statusHistory.forEach(history => {
          statusSheet.addRow({
            complaintId: complaint.id,
            complaintTitle: complaint.title,
            previousStatus: history.previousStatus || 'Initial',
            newStatus: history.newStatus,
            changedBy: 'Unknown', // You might need to join with user data
            changedAt: history.changedAt.toLocaleString(),
            notes: history.notes || '',
          });
        });
      }
    });
  }
  
  // Generate buffer
  return await workbook.xlsx.writeBuffer();
}

export async function generateSummaryExcel(
  summaryData: {
    totalComplaints: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byService: Record<string, number>;
    byProvider: Record<string, number>;
    averageResolutionTime: number;
    totalFinancialImpact: number;
  }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Summary');
  
  // Add totals
  worksheet.addRow(['Total Complaints', summaryData.totalComplaints]);
  worksheet.addRow(['Total Financial Impact', `$${summaryData.totalFinancialImpact.toFixed(2)}`]);
  worksheet.addRow(['Average Resolution Time', `${Math.round(summaryData.averageResolutionTime)} days`]);
  worksheet.addRow([]);
  
  // Add status breakdown
  worksheet.addRow(['Status Breakdown']);
  Object.entries(summaryData.byStatus).forEach(([status, count]) => {
    worksheet.addRow([status, count]);
  });
  worksheet.addRow([]);
  
  // Add priority breakdown
  worksheet.addRow(['Priority Breakdown']);
  Object.entries(summaryData.byPriority).forEach(([priority, count]) => {
    worksheet.addRow([`Priority ${priority}`, count]);
  });
  worksheet.addRow([]);
  
  // Add service breakdown
  worksheet.addRow(['Service Breakdown']);
  Object.entries(summaryData.byService).forEach(([service, count]) => {
    worksheet.addRow([service, count]);
  });
  worksheet.addRow([]);
  
  // Add provider breakdown
  worksheet.addRow(['Provider Breakdown']);
  Object.entries(summaryData.byProvider).forEach(([provider, count]) => {
    worksheet.addRow([provider, count]);
  });
  
  // Format headers
  [1, 5, 10, 15].forEach(rowIndex => {
    if (worksheet.getRow(rowIndex).getCell(1).value) {
      worksheet.getRow(rowIndex).font = { bold: true };
      worksheet.getRow(rowIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
    }
  });
  
  return await workbook.xlsx.writeBuffer();
}