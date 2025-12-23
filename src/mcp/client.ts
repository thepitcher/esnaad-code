import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPServer, Tool } from '../types.js';

export class MCPClient {
  private clients: Map<string, Client> = new Map();
  private mcpTools: Tool[] = [];

  async initialize(servers: MCPServer[]): Promise<void> {
    if (!servers || servers.length === 0) {
      return;
    }

    for (const server of servers) {
      try {
        await this.connectToServer(server);
      } catch (error) {
        console.error(`Failed to connect to MCP server ${server.name}:`, error);
      }
    }
  }

  private async connectToServer(server: MCPServer): Promise<void> {
    const transport = new StdioClientTransport({
      command: server.command,
      args: server.args,
      env: server.env
    });

    const client = new Client({
      name: 'esnaad-code',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);
    this.clients.set(server.name, client);

    const { tools } = await client.listTools();

    for (const mcpTool of tools) {
      const tool: Tool = {
        name: `mcp_${server.name}_${mcpTool.name}`,
        description: mcpTool.description || `MCP tool: ${mcpTool.name} from ${server.name}`,
        inputSchema: mcpTool.inputSchema as any,
        execute: async (params: any) => {
          try {
            const result = await client.callTool({
              name: mcpTool.name,
              arguments: params
            });

            if (result.isError) {
              return `Error: ${(result.content as any[]).map((c: any) => c.text).join('\n')}`;
            }

            return (result.content as any[]).map((c: any) => {
              if (c.type === 'text') return c.text;
              if (c.type === 'image') return `[Image: ${c.data}]`;
              return JSON.stringify(c);
            }).join('\n');
          } catch (error: any) {
            return `Error calling MCP tool: ${error.message}`;
          }
        }
      };

      this.mcpTools.push(tool);
    }

    console.log(`Connected to MCP server: ${server.name} (${tools.length} tools)`);
  }

  getTools(): Tool[] {
    return this.mcpTools;
  }

  async close(): Promise<void> {
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
      } catch (error) {
        console.error(`Error closing MCP client ${name}:`, error);
      }
    }
    this.clients.clear();
  }
}
