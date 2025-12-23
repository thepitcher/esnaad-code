export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any) => Promise<string>;
  requiresConfirmation?: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Represents a tool operation pending user approval
 */
export interface PendingOperation {
  toolCallId: string;
  toolName: string;
  params: Record<string, any>;
  displaySummary: string;
}

/**
 * Result of the plan review process
 */
export type PlanReviewResult =
  | { action: 'accept_all' }
  | { action: 'reject_all' }
  | { action: 'step_results'; results: StepResult[] };

/**
 * Result for individual step in step-by-step review
 */
export interface StepResult {
  toolCallId: string;
  action: 'accept' | 'reject' | 'edit';
  editedParams?: Record<string, any>;
}

/**
 * Configuration for plan mode behavior
 */
export interface PlanModeConfig {
  enabled: boolean;
  autoApproveReadOnly: boolean;
}

export interface AgentConfig {
  apiKey: string;
  apiBase?: string;
  model: string;
  orgId?: string;
  maxIterations?: number;
}

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface Config {
  openai: AgentConfig;
  mcpServers?: MCPServer[];
}

/**
 * Loaded rules context for injection into system prompt
 */
export interface RulesContext {
  globalRules: string | null;      // Content of ~/.esnaad/rules.md
  projectRules: string | null;      // Content of ./ESNAAD.md
  combinedRules: string;            // Merged rules for system prompt
}

/**
 * Project memory context
 */
export interface MemoryContext {
  projectId: string;               // Hash of project path
  projectPath: string;             // Absolute project path
  notes: string[];                 // List of stored notes
  storagePath: string;             // Path to memory file
}

/**
 * Standard paths for Esnaad configuration
 */
export interface EsnaadPaths {
  globalRulesPath: string;         // ~/.esnaad/rules.md
  memoryBasePath: string;          // ~/.esnaad/memory/
  configPath: string;              // ~/.esnaad/config.json
}
