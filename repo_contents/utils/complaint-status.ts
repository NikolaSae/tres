// utils/complaint-status.ts
import { ComplaintStatus } from '@prisma/client';

/**
 * Returns a human-readable label for a complaint status
 * @param status ComplaintStatus enum value
 * @returns Formatted status label
 */
export function getStatusLabel(status: ComplaintStatus): string {
  switch (status) {
    case 'NEW':
      return 'New';
    case 'ASSIGNED':
      return 'Assigned';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'PENDING':
      return 'Pending';
    case 'RESOLVED':
      return 'Resolved';
    case 'CLOSED':
      return 'Closed';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
}

/**
 * Returns the appropriate CSS class for a status badge
 * @param status ComplaintStatus enum value
 * @returns CSS class name for the status
 */
export function getStatusColorClass(status: ComplaintStatus): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800';
    case 'ASSIGNED':
      return 'bg-purple-100 text-purple-800';
    case 'IN_PROGRESS':
      return 'bg-indigo-100 text-indigo-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Determines if a status change requires approval
 * @param fromStatus Current status
 * @param toStatus Target status
 * @returns Boolean indicating if approval is needed
 */
export function statusChangeRequiresApproval(fromStatus: ComplaintStatus, toStatus: ComplaintStatus): boolean {
  // Status changes that might require manager approval
  const restrictedChanges = [
    // From any status to Rejected
    { from: '*', to: 'REJECTED' },
    // From Resolved or Closed to any other status
    { from: 'RESOLVED', to: '*' },
    { from: 'CLOSED', to: '*' }
  ];
  
  return restrictedChanges.some(change => 
    (change.from === '*' || change.from === fromStatus) && 
    (change.to === '*' || change.to === toStatus)
  );
}

/**
 * Returns the allowed next statuses for a given current status
 * @param currentStatus Current complaint status
 * @param isManager Whether the current user is a manager
 * @returns Array of allowed next statuses
 */
export function getAllowedNextStatuses(currentStatus: ComplaintStatus, isManager: boolean = false): ComplaintStatus[] {
  // Define status flow rules
  const statusFlow: Record<ComplaintStatus, ComplaintStatus[]> = {
    'NEW': ['ASSIGNED', 'REJECTED'],
    'ASSIGNED': ['IN_PROGRESS', 'PENDING', 'REJECTED'],
    'IN_PROGRESS': ['PENDING', 'RESOLVED', 'REJECTED'],
    'PENDING': ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
    'RESOLVED': ['CLOSED', 'IN_PROGRESS'], // Reopening is possible
    'CLOSED': isManager ? ['IN_PROGRESS'] : [], // Only managers can reopen closed complaints
    'REJECTED': isManager ? ['NEW'] : [] // Only managers can resurrect rejected complaints
  };
  
  return statusFlow[currentStatus] || [];
}