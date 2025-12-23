import { Tool } from '../types.js';
import { readTool, writeTool, editTool, globTool, grepTool } from './file-tools.js';
import { bashTool } from './bash-tool.js';

export const builtinTools: Tool[] = [
  readTool,
  writeTool,
  editTool,
  globTool,
  grepTool,
  bashTool
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
