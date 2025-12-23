import { Tool } from '../types.js';
import { readTool, writeTool, editTool, globTool, grepTool } from './file-tools.js';
import { bashTool } from './bash-tool.js';
import { gitTools } from './git-tool.js';

export const builtinTools: Tool[] = [
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
  bashTool,
  ...gitTools  // Add all 9 git tools
];

export function convertToolToOpenAIFormat(tool: Tool) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  };
}
