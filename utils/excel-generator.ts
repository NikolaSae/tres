// /utils/excel-generator.ts
import ExcelJS from 'exceljs';
import { ComplaintWithAllRelations } from '@/lib/types/complaint-types';

type ExportOptions = {
  includeComments?: boolean;
  includeStatusHistory?: boolean;
  includeAttachments?: boolean; // ✅ Dodato
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
};

export async function generateComplaintExcel(
  complaints: ComplaintWithAllRelations[], // ✅ Koristi novi tip
  options: ExportOptions = {}
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Complaints');
  
  // ... vaš postojeći kod za glavnu tabelu ...

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
      { header: 'Changed By ID', key: 'changedById', width: 20 },
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
            changedById: history.changedById,
            changedAt: history.changedAt.toLocaleString(),
            notes: history.notes || '',
          });
        });
      }
    });
  }

  // ✅ NOVO: Add attachments if requested
  if (options.includeAttachments && complaints.some(c => c.attachments && c.attachments.length > 0)) {
    const attachmentsSheet = workbook.addWorksheet('Attachments');
    
    attachmentsSheet.columns = [
      { header: 'Complaint ID', key: 'complaintId', width: 15 },
      { header: 'Complaint Title', key: 'complaintTitle', width: 30 },
      { header: 'File Name', key: 'fileName', width: 30 },
      { header: 'File Type', key: 'fileType', width: 15 },
      { header: 'File URL', key: 'fileUrl', width: 50 },
      { header: 'Uploaded At', key: 'uploadedAt', width: 20 },
    ];
    
    attachmentsSheet.getRow(1).font = { bold: true };
    attachmentsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
    
    complaints.forEach(complaint => {
      if (complaint.attachments && complaint.attachments.length > 0) {
        complaint.attachments.forEach(attachment => {
          attachmentsSheet.addRow({
            complaintId: complaint.id,
            complaintTitle: complaint.title,
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            fileUrl: attachment.fileUrl,
            uploadedAt: attachment.uploadedAt.toLocaleString(),
          });
        });
      }
    });
  }
  
  // Generate buffer
  return await workbook.xlsx.writeBuffer() as ExcelJS.Buffer;
}

// ... ostale funkcije