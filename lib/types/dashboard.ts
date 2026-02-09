// lib/types/dashboard.ts
import { UserRole, LogSeverity } from '@prisma/client';

export interface McpStats {
  totalQueries: number;
  topTools: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    userId: string;
    userName: string;
    toolName: string;
    timestamp: string;
    count: number;
  }>;
  period?: string;
  lastUpdated?: string;
}

export interface SystemHealth {
  users: { total: number; active: number };
  contracts: { total: number; active: number };
  complaints: { pending: number };
  humanitarians: Array<{
    name: string;
    shortNumber: string | null;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    mission: string | null;
  }>;
  systemStatus: 'healthy' | 'error';
  lastChecked: string;
}

export interface ToolUsage {
  name: string;
  actualName: string;
  count: number;
  lastUsed: string | null;
}

export interface ToolsUsageResponse {
  tools: ToolUsage[];
  totalUsage: number;
  period: string;
  lastUpdated: string;
}

export interface UserLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;      // ← OVO JE KLJUČNO – dozvoljava null
  severity: LogSeverity;
  createdAt: Date;
}

export interface DashboardData {
  stats: McpStats;
  health: SystemHealth;
  toolsUsage: ToolsUsageResponse;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}