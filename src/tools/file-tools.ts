import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Tool } from '../types.js';
import fg from 'fast-glob';
import { execSync } from 'child_process';

export const readTool: Tool = {
  name: 'read',
  description: 'Read the contents of a file',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to read'
      }
    },
    required: ['file_path']
  },
  execute: async (params: { file_path: string }) => {
    try {
      if (!existsSync(params.file_path)) {
        return `Error: File not found: ${params.file_path}`;
      }
      const content = readFileSync(params.file_path, 'utf-8');
      const lines = content.split('\n');
      const numberedLines = lines.map((line, idx) => `${idx + 1}\t${line}`).join('\n');
      return numberedLines;
    } catch (error: any) {
      return `Error reading file: ${error.message}`;
    }
  }
};

export const writeTool: Tool = {
  name: 'write',
  description: 'Write content to a file (creates new or overwrites existing)',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to write'
      },
      content: {
        type: 'string',
        description: 'The content to write to the file'
      }
    },
    required: ['file_path', 'content']
  },
  execute: async (params: { file_path: string; content: string }) => {
    try {
      writeFileSync(params.file_path, params.content, 'utf-8');
      return `Successfully wrote to ${params.file_path}`;
    } catch (error: any) {
      return `Error writing file: ${error.message}`;
    }
  }
};

export const editTool: Tool = {
  name: 'edit',
  description: 'Edit a file by replacing old_string with new_string',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to edit'
      },
      old_string: {
        type: 'string',
        description: 'The text to replace'
      },
      new_string: {
        type: 'string',
        description: 'The text to replace it with'
      },
      replace_all: {
        type: 'boolean',
        description: 'Replace all occurrences (default: false)'
      }
    },
    required: ['file_path', 'old_string', 'new_string']
  },
  execute: async (params: {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }) => {
    try {
      if (!existsSync(params.file_path)) {
        return `Error: File not found: ${params.file_path}`;
      }

      let content = readFileSync(params.file_path, 'utf-8');

      if (params.replace_all) {
        const count = (content.match(new RegExp(params.old_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        content = content.split(params.old_string).join(params.new_string);
        writeFileSync(params.file_path, content, 'utf-8');
        return `Successfully replaced ${count} occurrence(s) in ${params.file_path}`;
      } else {
        const occurrences = content.split(params.old_string).length - 1;
        if (occurrences === 0) {
          return `Error: old_string not found in file`;
        }
        if (occurrences > 1) {
          return `Error: old_string appears ${occurrences} times. Use replace_all: true to replace all occurrences.`;
        }
        content = content.replace(params.old_string, params.new_string);
        writeFileSync(params.file_path, content, 'utf-8');
        return `Successfully edited ${params.file_path}`;
      }
    } catch (error: any) {
      return `Error editing file: ${error.message}`;
    }
  }
};

export const globTool: Tool = {
  name: 'glob',
  description: 'Find files matching a glob pattern',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The glob pattern to match files (e.g., "**/*.ts")'
      },
      path: {
        type: 'string',
        description: 'The directory to search in (default: current directory)'
      }
    },
    required: ['pattern']
  },
  execute: async (params: { pattern: string; path?: string }) => {
    try {
      const cwd = params.path || process.cwd();
      const files = await fg(params.pattern, { cwd, dot: true });

      if (files.length === 0) {
        return 'No files found matching the pattern';
      }

      return files.join('\n');
    } catch (error: any) {
      return `Error finding files: ${error.message}`;
    }
  }
};

export const grepTool: Tool = {
  name: 'grep',
  description: 'Search for a pattern in files using ripgrep',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The regex pattern to search for'
      },
      path: {
        type: 'string',
        description: 'File or directory to search in (default: current directory)'
      },
      glob: {
        type: 'string',
        description: 'Glob pattern to filter files (e.g., "*.ts")'
      },
      case_insensitive: {
        type: 'boolean',
        description: 'Case insensitive search'
      },
      output_mode: {
        type: 'string',
        description: 'Output mode: "content", "files_with_matches", or "count"',
        enum: ['content', 'files_with_matches', 'count']
      }
    },
    required: ['pattern']
  },
  execute: async (params: {
    pattern: string;
    path?: string;
    glob?: string;
    case_insensitive?: boolean;
    output_mode?: string;
  }) => {
    try {
      let cmd = 'rg';

      if (params.case_insensitive) cmd += ' -i';

      const mode = params.output_mode || 'files_with_matches';
      if (mode === 'files_with_matches') {
        cmd += ' -l';
      } else if (mode === 'count') {
        cmd += ' -c';
      } else {
        cmd += ' -n';
      }

      if (params.glob) {
        cmd += ` --glob '${params.glob}'`;
      }

      cmd += ` '${params.pattern}'`;

      if (params.path) {
        cmd += ` '${params.path}'`;
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      return result || 'No matches found';
    } catch (error: any) {
      if (error.status === 1) {
        return 'No matches found';
      }
      return `Error searching: ${error.message}`;
    }
  }
};
