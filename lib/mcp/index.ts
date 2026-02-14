// lib/mcp/index.ts - Centralizovani exports za MCP sistem

export { InternalMcpServer } from './internal-server';
export { AIContextBuilder } from './ai-context-builder';
export { WriteOperations, writeOperations } from './write-tools';
export { 
  logQuery, 
  getUserQueryLogs, 
  getToolUsageStats, 
  getMostUsedTools,
  cleanupOldLogs 
} from './query-logger';

export type {
  McpContext,
  McpResult,
  McpTool,
  ToolCategory,
  JsonSchema,
  JsonSchemaProperty,
  QueryLogEntry,
  ToolExecutionOptions,
  ValidationResult,
  AIResponse
} from './types';

// Lazy initialization
import { InternalMcpServer } from './internal-server';

let _mcpServer: InternalMcpServer | null = null;

export function getMcpServer(): InternalMcpServer {
  if (!_mcpServer) {
    _mcpServer = new InternalMcpServer();
  }
  return _mcpServer;
}

// Ili direktno export instance
export const mcpServer = new InternalMcpServer();