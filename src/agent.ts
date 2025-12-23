import OpenAI from 'openai';
import https from 'https';
import { AgentConfig, Message, Tool } from './types.js';
import { builtinTools, convertToolToOpenAIFormat } from './tools/index.js';
import { MCPClient } from './mcp/client.js';

export class Agent {
  private openai: OpenAI;
  private config: AgentConfig;
  private tools: Map<string, Tool> = new Map();
  private messages: Message[] = [];
  private mcpClient: MCPClient;

  constructor(config: AgentConfig, mcpClient: MCPClient) {
    this.config = config;
    this.mcpClient = mcpClient;

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

    // System message
    this.messages.push({
      role: 'system',
      content: `You are Esnaad Code, an AI coding assistant that helps users with software development tasks.

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

When using tools:
1. Always read files before editing them
2. Use glob to find files when you don't know exact paths
3. Use grep to search for code patterns
4. For git operations, ALWAYS use git_* tools instead of bash
5. Be thorough and complete tasks fully

Examples of git tool usage:
- "show git status" → use git_status
- "what changed?" → use git_diff
- "show recent commits" → use git_log
- "commit changes" → use git_add then git_commit
- "push to remote" → use git_push

Current working directory: ${process.cwd()}`
    });
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

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: this.messages as any,
        tools: Array.from(this.tools.values()).map(convertToolToOpenAIFormat),
        tool_choice: 'auto'
      });

      const message = response.choices[0].message;

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

      // Execute tool calls
      for (const toolCall of message.tool_calls) {
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

    return 'Maximum iterations reached';
  }

  getMessages(): Message[] {
    return this.messages;
  }

  clearHistory(): void {
    // Keep only system message
    this.messages = this.messages.slice(0, 1);
  }
}
