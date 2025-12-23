import OpenAI from 'openai';
import https from 'https';
import { Interface as ReadlineInterface } from 'readline';
import { AgentConfig, Message, Tool, PendingOperation, PlanReviewResult, PlanModeConfig, RulesContext, MemoryContext, DebugConfig } from './types.js';
import { builtinTools, convertToolToOpenAIFormat } from './tools/index.js';
import { MCPClient } from './mcp/client.js';
import { reviewPlan, formatOperationForDisplay } from './plan-review.js';

export class Agent {
  private openai: OpenAI;
  private config: AgentConfig;
  private tools: Map<string, Tool> = new Map();
  private messages: Message[] = [];
  private mcpClient: MCPClient;
  private planModeConfig: PlanModeConfig;
  private readline?: ReadlineInterface;
  private rulesContext?: RulesContext;
  private memoryContext?: MemoryContext;
  private debugConfig?: DebugConfig;

  constructor(
    config: AgentConfig,
    mcpClient: MCPClient,
    planModeConfig?: PlanModeConfig,
    readline?: ReadlineInterface,
    rulesContext?: RulesContext,
    memoryContext?: MemoryContext,
    debugConfig?: DebugConfig
  ) {
    this.config = config;
    this.mcpClient = mcpClient;
    this.planModeConfig = planModeConfig || { enabled: true, autoApproveReadOnly: true };
    this.readline = readline;
    this.rulesContext = rulesContext;
    this.memoryContext = memoryContext;
    this.debugConfig = debugConfig;

    // Configure HTTPS agent for SSL certificate handling
    const httpsAgent = new https.Agent({
      // Check if SSL verification should be disabled (for self-signed certs)
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'
    });

    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiBase,
      organization: config.orgId,
      httpAgent: httpsAgent
    });

    // Register builtin tools
    for (const tool of builtinTools) {
      this.tools.set(tool.name, tool);
    }

    // Register MCP tools
    for (const tool of mcpClient.getTools()) {
      this.tools.set(tool.name, tool);
    }

    // System message with dynamic rules and memory injection
    this.messages.push({
      role: 'system',
      content: this.buildSystemPrompt()
    });
  }

  /**
   * Build the system prompt with optional rules and memory injection
   */
  private buildSystemPrompt(): string {
    const parts: string[] = [];

    // Base system prompt
    parts.push(`You are Esnaad Code, an AI coding assistant that helps users with software development tasks.

You have access to various tools:

File Operations:
- read: Read file contents
- write: Write or create files
- edit: Edit files by replacing text
- glob: Find files matching patterns
- grep: Search for text in files

Shell Execution:
- bash: Execute shell commands (use for npm, system commands, etc.)

Git Operations (USE THESE for git operations, NOT bash):
- git_status: Check repository status (staged, unstaged, untracked files)
- git_diff: View changes in files (use staged: true for staged changes)
- git_log: View commit history (supports limit, author, since filters)
- git_add: Stage files for commit (use "." to stage all)
- git_commit: Create commits with messages
- git_push: Push commits to remote repository
- git_pull: Pull changes from remote repository
- git_branch: List, create, or delete branches
- git_checkout: Switch branches or restore files

Memory:
- memory_save: Save important facts about this project to persistent memory

When using tools:
1. Always read files before editing them
2. Use glob to find files when you don't know exact paths
3. Use grep to search for code patterns
4. For git operations, ALWAYS use git_* tools instead of bash
5. Be thorough and complete tasks fully
6. Use memory_save to remember important project facts for future sessions

Examples of git tool usage:
- "show git status" → use git_status
- "what changed?" → use git_diff
- "show recent commits" → use git_log
- "commit changes" → use git_add then git_commit
- "push to remote" → use git_push`);

    // Inject rules if present
    if (this.rulesContext?.combinedRules) {
      parts.push('\n\n=== USER RULES ===');
      parts.push('Follow these rules when working on this project:');
      parts.push(this.rulesContext.combinedRules);
      parts.push('=== END RULES ===');
    }

    // Inject memory if present
    if (this.memoryContext?.notes && this.memoryContext.notes.length > 0) {
      parts.push('\n\n=== PROJECT CONTEXT ===');
      parts.push('Important information about this project:');
      this.memoryContext.notes.forEach(note => parts.push(`- ${note}`));
      parts.push('=== END PROJECT CONTEXT ===');
    }

    parts.push(`\n\nCurrent working directory: ${process.cwd()}`);

    return parts.join('\n');
  }

  async chat(userMessage: string): Promise<string> {
    this.messages.push({
      role: 'user',
      content: userMessage
    });

    let iterations = 0;
    const maxIterations = this.config.maxIterations || 50;

    while (iterations < maxIterations) {
      iterations++;

      // Log request messages in conversation debug mode
      if (this.debugConfig?.type === 'conversation') {
        console.log('\n\x1b[36m[CONVERSATION] Request messages:\x1b[0m');
        console.log(JSON.stringify(this.messages, null, 2));
      }

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: this.messages as any,
        tools: Array.from(this.tools.values()).map(convertToolToOpenAIFormat),
        tool_choice: 'auto'
      });

      const message = response.choices[0].message;

      // Log response message in conversation debug mode
      if (this.debugConfig?.type === 'conversation') {
        console.log('\n\x1b[36m[CONVERSATION] Response message:\x1b[0m');
        console.log(JSON.stringify(message, null, 2));
      }

      // Add assistant message
      this.messages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls as any
      });

      // If no tool calls, return the response
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return message.content || 'No response';
      }

      // Execute tool calls - with or without plan mode
      if (this.planModeConfig.enabled && this.readline) {
        // Plan mode: categorize tools and review destructive ones
        const toolResults = await this.processToolCallsWithPlanMode(message.tool_calls);
        for (const result of toolResults) {
          this.messages.push(result);
        }
      } else {
        // Original behavior: execute all tools immediately
        await this.executeAllToolCalls(message.tool_calls);
      }
    }

    return 'Maximum iterations reached';
  }

  getMessages(): Message[] {
    return this.messages;
  }

  clearHistory(): void {
    // Keep only system message
    this.messages = this.messages.slice(0, 1);
  }

  /**
   * Set plan mode enabled/disabled
   */
  setPlanMode(enabled: boolean): void {
    this.planModeConfig.enabled = enabled;
  }

  /**
   * Check if plan mode is enabled
   */
  isPlanModeEnabled(): boolean {
    return this.planModeConfig.enabled;
  }

  /**
   * Execute all tool calls without confirmation (original behavior)
   */
  private async executeAllToolCalls(toolCalls: any[]): Promise<void> {
    for (const toolCall of toolCalls) {
      const tool = this.tools.get(toolCall.function.name);

      if (!tool) {
        this.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Error: Tool ${toolCall.function.name} not found`
        });
        continue;
      }

      let params;
      try {
        params = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        this.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Error: Invalid JSON arguments`
        });
        continue;
      }

      console.log(`\n🔧 Executing: ${toolCall.function.name}`);
      const result = await tool.execute(params);

      this.messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result
      });
    }
  }

  /**
   * Process tool calls with plan mode - categorize and review destructive operations
   */
  private async processToolCallsWithPlanMode(toolCalls: any[]): Promise<Message[]> {
    const results: Message[] = [];
    const pendingOperations: PendingOperation[] = [];
    const autoExecuteOperations: Array<{ toolCall: any; tool: Tool; params: any }> = [];

    // Phase 1: Categorize tool calls
    for (const toolCall of toolCalls) {
      const tool = this.tools.get(toolCall.function.name);

      if (!tool) {
        results.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Error: Tool ${toolCall.function.name} not found`
        });
        continue;
      }

      let params;
      try {
        params = JSON.parse(toolCall.function.arguments);
      } catch (error) {
        results.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Error: Invalid JSON arguments`
        });
        continue;
      }

      if (tool.requiresConfirmation) {
        pendingOperations.push({
          toolCallId: toolCall.id,
          toolName: tool.name,
          params,
          displaySummary: formatOperationForDisplay({
            toolCallId: toolCall.id,
            toolName: tool.name,
            params,
            displaySummary: ''
          })
        });
      } else {
        autoExecuteOperations.push({ toolCall, tool, params });
      }
    }

    // Phase 2: Auto-execute read-only operations
    for (const { toolCall, tool, params } of autoExecuteOperations) {
      console.log(`\n🔧 Auto-executing (read-only): ${tool.name}`);
      const result = await tool.execute(params);
      results.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result
      });
    }

    // Phase 3: Review destructive operations if any
    if (pendingOperations.length > 0 && this.readline) {
      const reviewResult = await reviewPlan(pendingOperations, this.readline);
      const destructiveResults = await this.handleReviewResult(pendingOperations, reviewResult);
      results.push(...destructiveResults);
    }

    return results;
  }

  /**
   * Handle the user's review decision
   */
  private async handleReviewResult(
    operations: PendingOperation[],
    reviewResult: PlanReviewResult
  ): Promise<Message[]> {
    const results: Message[] = [];

    switch (reviewResult.action) {
      case 'accept_all':
        // Execute all pending operations
        for (const op of operations) {
          const tool = this.tools.get(op.toolName)!;
          console.log(`\n🔧 Executing (approved): ${op.toolName}`);
          const result = await tool.execute(op.params);
          results.push({
            role: 'tool',
            tool_call_id: op.toolCallId,
            content: result
          });
        }
        break;

      case 'reject_all':
        // Return rejection messages for all
        for (const op of operations) {
          results.push({
            role: 'tool',
            tool_call_id: op.toolCallId,
            content: `Operation rejected by user: ${op.toolName}`
          });
        }
        break;

      case 'step_results':
        // Process each step individually
        for (const stepResult of reviewResult.results) {
          const op = operations.find(o => o.toolCallId === stepResult.toolCallId)!;
          const tool = this.tools.get(op.toolName)!;

          if (stepResult.action === 'accept') {
            console.log(`\n🔧 Executing (approved): ${op.toolName}`);
            const result = await tool.execute(op.params);
            results.push({
              role: 'tool',
              tool_call_id: op.toolCallId,
              content: result
            });
          } else if (stepResult.action === 'edit') {
            console.log(`\n🔧 Executing (edited): ${op.toolName}`);
            const result = await tool.execute(stepResult.editedParams!);
            results.push({
              role: 'tool',
              tool_call_id: op.toolCallId,
              content: result
            });
          } else {
            results.push({
              role: 'tool',
              tool_call_id: op.toolCallId,
              content: `Operation rejected by user: ${op.toolName}`
            });
          }
        }
        break;
    }

    return results;
  }
}
