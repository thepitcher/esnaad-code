import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from '../types.js';

const execAsync = promisify(exec);

export const bashTool: Tool = {
  name: 'bash',
  description: 'Execute a bash command in the shell',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The bash command to execute'
      },
      timeout: {
        type: 'number',
        description: 'Optional timeout in milliseconds (default: 120000)'
      }
    },
    required: ['command']
  },
  execute: async (params: { command: string; timeout?: number }) => {
    try {
      const timeout = params.timeout || 120000;
      const { stdout, stderr } = await execAsync(params.command, {
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      let result = '';
      if (stdout) result += stdout;
      if (stderr) result += stderr;

      return result || 'Command executed successfully (no output)';
    } catch (error: any) {
      let errorMsg = `Error executing command: ${error.message}`;
      if (error.stdout) errorMsg += `\nStdout: ${error.stdout}`;
      if (error.stderr) errorMsg += `\nStderr: ${error.stderr}`;
      return errorMsg;
    }
  }
};
