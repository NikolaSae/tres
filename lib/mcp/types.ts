// lib/mcp/types.ts


export interface McpContext {
  userId: string;
  userRole: string;
}

/**
 * Definicija MCP alata
 * Opisuje jedan alat koji AI može koristiti
 */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
  examples?: string[];
  category?: 'read' | 'write' | 'analytics' | 'system';
  responseFormat?: string;
}

/**
 * Rezultat izvršavanja MCP alata
 * Standardizovan format odgovora
 */
export interface McpResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: McpMetadata;
}

/**
 * Dodatne informacije o izvršenju
 */
export interface McpMetadata {
  executionTime?: number;
  recordsAffected?: number;
  warnings?: string[];
  queryInfo?: {
    toolName?: string;
    args?: any;
    userId?: string;
  };
}

/**
 * Tip za poruke u chat istoriji
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

/**
 * Query analiza rezultat
 */
export interface QueryAnalysis {
  isDatabaseQuery: boolean;
  toolName?: string;
  args?: any;
  context?: string;
  confidence?: number;
}

/**
 * Parametri za filtriranje ugovora
 */
export interface ContractFilters {
  status?: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'RENEWAL_IN_PROGRESS' | 'TERMINATED';
  type?: 'PROVIDER' | 'HUMANITARIAN' | 'PARKING' | 'BULK';
  limit?: number;
  offset?: number;
  orderBy?: {
    createdAt?: 'asc' | 'desc';
    updatedAt?: 'asc' | 'desc';
    name?: 'asc' | 'desc';
  };
}

/**
 * Parametri za filtriranje provajdera
 */
export interface ProviderFilters {
  isActive?: boolean;
  name?: string;
  limit?: number;
  offset?: number;
  orderBy?: {
    name?: 'asc' | 'desc';
    createdAt?: 'asc' | 'desc';
  };
}

/**
 * Parametri za filtriranje žalbi
 */
export interface ComplaintFilters {
  status?: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  priority?: number;
  assignedAgentId?: string;
  limit?: number;
  offset?: number;
  orderBy?: {
    createdAt?: 'asc' | 'desc';
    priority?: 'asc' | 'desc';
    updatedAt?: 'asc' | 'desc';
  };
}

/**
 * Parametri za pretragu entiteta
 */
export interface SearchEntityParams {
  query: string;
  entities?: ('contracts' | 'providers' | 'complaints' | 'users' | 'humanitarian_orgs')[];
  limit?: number;
  offset?: number;
  onlyWithShortNumbers?: boolean;
}

/**
 * Parametri za korisničke statistike
 */
export interface UserStatsParams {
  period?: 'week' | 'month' | 'year';
}

/**
 * Parametri za pregled aktivnosti
 */
export interface ActivityOverviewParams {
  period?: 'today' | 'week' | 'month';
}

/**
 * Parametri za finansijski pregled
 */
export interface FinancialSummaryParams {
  period?: 'month' | 'quarter' | 'year';
  contractType?: 'PROVIDER' | 'HUMANITARIAN' | 'PARKING';
}

/**
 * Parametri za zdravlje sistema
 */
export interface SystemHealthParams {
  includeDetails?: boolean;
}

/**
 * Parametri za upravljanje korisnicima
 */
export interface ManageUserParams {
  action: 'view' | 'activate' | 'deactivate';
  userId?: string;
  email?: string;
}

/**
 * Tool mapping tip
 */
export type ToolMapping = Record<string, string>;

/**
 * Response format tip za različite kontekste
 */
export type ResponseContext = 
  | 'contracts'
  | 'providers'
  | 'complaints'
  | 'humanitarian'
  | 'stats'
  | 'search'
  | 'activity'
  | 'financial'
  | 'system'
  | 'debug';

/**
 * Dozvole za alate po ulogama
 */
export interface RolePermissions {
  USER: string[];
  AGENT: string[];
  MANAGER: string[];
  ADMIN: string[];
}

/**
 * Log entry za query logger
 */
export interface QueryLogEntry {
  userId: string;
  toolName: string;
  args: any;
  timestamp: Date;
  executionTime?: number;
  success?: boolean;
  error?: string;
}

/**
 * Write operation rezultat
 */
export interface WriteOperationResult extends McpResult {
  recordId?: string;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsDeleted?: number;
}

/**
 * Parametri za kreiranje ugovora
 */
export interface CreateContractParams {
  name: string;
  contractNumber: string;
  type: 'PROVIDER' | 'HUMANITARIAN' | 'PARKING' | 'BULK';
  startDate: string | Date;
  endDate: string | Date;
  providerId?: string;
  humanitarianOrgId?: string;
  parkingServiceId?: string;
  description?: string;
  revenuePercentage?: number;
}

/**
 * Parametri za ažuriranje ugovora
 */
export interface UpdateContractParams {
  contractId: string;
  updates: Partial<CreateContractParams>;
}

/**
 * Parametri za kreiranje žalbe
 */
export interface CreateComplaintParams {
  title: string;
  description: string;
  priority?: number;
  serviceId?: string;
  providerId?: string;
  financialImpact?: number;
}

/**
 * Parametri za ažuriranje žalbe
 */
export interface UpdateComplaintParams {
  complaintId: string;
  status?: ComplaintFilters['status'];
  priority?: number;
  assignedAgentId?: string;
  resolution?: string;
}

/**
 * Parametri za dodavanje komentara
 */
export interface AddCommentParams {
  complaintId: string;
  content: string;
  isInternal?: boolean;
}

/**
 * Summary statistika
 */
export interface SummaryStats {
  active?: number;
  expired?: number;
  pending?: number;
  new?: number;
  inProgress?: number;
  resolved?: number;
  inactive?: number;
  total?: number;
}

/**
 * Sistem zdravlje podaci
 */
export interface SystemHealthData {
  users: {
    total: number;
    active: number;
  };
  contracts: {
    total: number;
    active: number;
  };
  complaints: {
    pending: number;
  };
}

/**
 * Aktivnost pregled podaci
 */
export interface ActivityOverviewData {
  newContracts: number;
  expiringContracts: number;
  newComplaints: number;
  activeRenewals: number;
  recentActivities: number;
}

/**
 * Finansijski pregled podaci
 */
export interface FinancialSummaryData {
  activeContracts: number;
  averageRevenuePercentage: number;
  contractType: string;
}

/**
 * Korisničke statistike podaci
 */
export interface UserStatsData {
  contractsCreated: number;
  complaintsSubmitted: number;
  activitiesCount: number;
}

/**
 * Error tipovi za MCP operacije
 */
export class McpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'McpError';
  }
}

export class UnauthorizedError extends McpError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends McpError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends McpError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends McpError {
  constructor(message: string = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class DatabaseError extends McpError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500);
  }
}