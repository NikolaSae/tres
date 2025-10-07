// lib/mcp/types.ts - Type definitions for MCP system

/**
 * Kontekst korisnika koji se prosleđuje svim MCP operacijama
 */
export interface McpContext {
  userId: string;
  userRole: 'ADMIN' | 'MANAGER' | 'AGENT' | 'USER';
  metadata?: Record<string, any>; // Dodatni kontekst po potrebi
}

/**
 * Rezultat izvršavanja MCP alata
 */
export interface McpResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    cached?: boolean;
    [key: string]: any;
  };
}

/**
 * Kategorije alata
 */
export type ToolCategory = 'read' | 'write' | 'analytics' | 'system';

/**
 * Definicija MCP alata
 */
export interface McpTool {
  name: string;
  description: string;
  category: ToolCategory;
  examples?: string[]; // Primeri korišćenja za AI
  inputSchema: JsonSchema;
  requiredRole?: string[]; // Uloge koje mogu koristiti ovaj alat
  outputSchema?: JsonSchema; // Opciono: format output-a
}

/**
 * JSON Schema type (simplified)
 */
export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  items?: JsonSchemaProperty;
  enum?: any[];
  default?: any;
  description?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * JSON Schema Property
 */
export interface JsonSchemaProperty {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  description?: string;
  enum?: any[];
  default?: any;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Query log entry za tracking
 */
export interface QueryLogEntry {
  id: string;
  userId: string;
  toolName: string;
  params: any;
  result?: any;
  success: boolean;
  executionTime?: number;
  timestamp: Date;
  error?: string;
}

/**
 * Tool execution options
 */
export interface ToolExecutionOptions {
  timeout?: number; // Timeout u milisekundama
  retries?: number; // Broj pokušaja u slučaju greške
  cache?: boolean; // Da li keširaju rezultat
  cacheTTL?: number; // TTL za keš u sekundama
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * AI Response format
 */
export interface AIResponse {
  message: string;
  toolCall?: {
    toolName: string;
    params: any;
    requiresConfirmation: boolean;
  };
  suggestions?: string[];
  metadata?: Record<string, any>;
}