import { execSync } from 'child_process';
import { Tool } from '../types.js';

/**
 * Git tool for version control operations
 * Provides safe git commands with proper error handling
 */

export const gitStatusTool: Tool = {
  name: 'git_status',
  description: 'Get the current git status of the repository (staged, unstaged, untracked files)',
  inputSchema: {
    type: 'object',
    properties: {
      short: {
        type: 'boolean',
        description: 'Use short format (default: false)'
      }
    }
  },
  execute: async (params: { short?: boolean }) => {
    try {
      const cmd = params.short ? 'git status -s' : 'git status';
      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      return result || 'Working tree clean';
    } catch (error: any) {
      if (error.message.includes('not a git repository')) {
        return 'Error: Not a git repository. Initialize with: git init';
      }
      return `Error: ${error.message}`;
    }
  }
};

export const gitDiffTool: Tool = {
  name: 'git_diff',
  description: 'Show changes in files (unstaged changes by default, or staged with --staged)',
  inputSchema: {
    type: 'object',
    properties: {
      staged: {
        type: 'boolean',
        description: 'Show staged changes instead of unstaged (default: false)'
      },
      file_path: {
        type: 'string',
        description: 'Specific file to diff (optional)'
      }
    }
  },
  execute: async (params: { staged?: boolean; file_path?: string }) => {
    try {
      let cmd = 'git diff';
      if (params.staged) {
        cmd += ' --staged';
      }
      if (params.file_path) {
        cmd += ` "${params.file_path}"`;
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      return result || 'No changes';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

export const gitLogTool: Tool = {
  name: 'git_log',
  description: 'View commit history with customizable format and limit',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of commits to show (default: 10)'
      },
      oneline: {
        type: 'boolean',
        description: 'Show one line per commit (default: false)'
      },
      author: {
        type: 'string',
        description: 'Filter by author name'
      },
      since: {
        type: 'string',
        description: 'Show commits since date (e.g., "2 weeks ago", "2024-01-01")'
      }
    }
  },
  execute: async (params: { limit?: number; oneline?: boolean; author?: string; since?: string }) => {
    try {
      let cmd = 'git log';

      if (params.oneline) {
        cmd += ' --oneline';
      }

      const limit = params.limit || 10;
      cmd += ` -n ${limit}`;

      if (params.author) {
        cmd += ` --author="${params.author}"`;
      }

      if (params.since) {
        cmd += ` --since="${params.since}"`;
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd()
      });

      return result || 'No commits found';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

export const gitAddTool: Tool = {
  name: 'git_add',
  description: 'Stage files for commit. Use "." to stage all changes.',
  inputSchema: {
    type: 'object',
    properties: {
      files: {
        type: 'string',
        description: 'File path(s) to stage. Use "." for all files, or specific paths separated by spaces'
      }
    },
    required: ['files']
  },
  requiresConfirmation: true,
  execute: async (params: { files: string }) => {
    try {
      const cmd = `git add ${params.files}`;
      execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });
      return `Successfully staged: ${params.files}`;
    } catch (error: any) {
      return `Error staging files: ${error.message}`;
    }
  }
};

export const gitCommitTool: Tool = {
  name: 'git_commit',
  description: 'Create a commit with a message. IMPORTANT: Only commit when user explicitly asks.',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Commit message'
      },
      amend: {
        type: 'boolean',
        description: 'Amend the previous commit (default: false)'
      }
    },
    required: ['message']
  },
  requiresConfirmation: true,
  execute: async (params: { message: string; amend?: boolean }) => {
    try {
      let cmd = 'git commit';

      if (params.amend) {
        cmd += ' --amend';
      }

      // Use heredoc-style for message to handle multi-line and special characters
      const escapedMessage = params.message.replace(/'/g, "'\\''");
      cmd += ` -m '${escapedMessage}'`;

      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      return result || 'Commit created successfully';
    } catch (error: any) {
      if (error.message.includes('nothing to commit')) {
        return 'Error: Nothing to commit (no changes staged)';
      }
      return `Error creating commit: ${error.message}`;
    }
  }
};

export const gitPushTool: Tool = {
  name: 'git_push',
  description: 'Push commits to remote repository. IMPORTANT: Only push when user explicitly asks.',
  inputSchema: {
    type: 'object',
    properties: {
      remote: {
        type: 'string',
        description: 'Remote name (default: origin)'
      },
      branch: {
        type: 'string',
        description: 'Branch name to push (default: current branch)'
      },
      set_upstream: {
        type: 'boolean',
        description: 'Set upstream tracking (-u flag) (default: false)'
      }
    }
  },
  requiresConfirmation: true,
  execute: async (params: { remote?: string; branch?: string; set_upstream?: boolean }) => {
    try {
      const remote = params.remote || 'origin';
      let cmd = `git push`;

      if (params.set_upstream) {
        cmd += ' -u';
      }

      cmd += ` ${remote}`;

      if (params.branch) {
        cmd += ` ${params.branch}`;
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout for network operations
      });

      return result || 'Successfully pushed to remote';
    } catch (error: any) {
      if (error.message.includes('failed to push')) {
        return 'Error: Push rejected. You may need to pull first or use force push (not recommended).';
      }
      return `Error pushing: ${error.message}`;
    }
  }
};

export const gitPullTool: Tool = {
  name: 'git_pull',
  description: 'Pull changes from remote repository',
  inputSchema: {
    type: 'object',
    properties: {
      remote: {
        type: 'string',
        description: 'Remote name (default: origin)'
      },
      branch: {
        type: 'string',
        description: 'Branch name to pull (default: current branch)'
      }
    }
  },
  requiresConfirmation: true,
  execute: async (params: { remote?: string; branch?: string }) => {
    try {
      const remote = params.remote || 'origin';
      let cmd = `git pull ${remote}`;

      if (params.branch) {
        cmd += ` ${params.branch}`;
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout for network operations
      });

      return result || 'Already up to date';
    } catch (error: any) {
      if (error.message.includes('merge conflict')) {
        return 'Error: Merge conflicts detected. Resolve conflicts manually and commit.';
      }
      return `Error pulling: ${error.message}`;
    }
  }
};

export const gitBranchTool: Tool = {
  name: 'git_branch',
  description: 'List, create, or delete branches',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform: "list", "create", "delete"',
        enum: ['list', 'create', 'delete']
      },
      branch_name: {
        type: 'string',
        description: 'Branch name (required for create/delete)'
      },
      force: {
        type: 'boolean',
        description: 'Force delete branch (only for delete action)'
      }
    },
    required: ['action']
  },
  requiresConfirmation: true,
  execute: async (params: { action: string; branch_name?: string; force?: boolean }) => {
    try {
      let cmd = 'git branch';

      if (params.action === 'list') {
        cmd += ' -a'; // Show all branches including remote
      } else if (params.action === 'create') {
        if (!params.branch_name) {
          return 'Error: branch_name is required for create action';
        }
        cmd += ` ${params.branch_name}`;
      } else if (params.action === 'delete') {
        if (!params.branch_name) {
          return 'Error: branch_name is required for delete action';
        }
        cmd += params.force ? ' -D' : ' -d';
        cmd += ` ${params.branch_name}`;
      }

      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      return result || `Branch operation completed: ${params.action}`;
    } catch (error: any) {
      return `Error with branch operation: ${error.message}`;
    }
  }
};

export const gitCheckoutTool: Tool = {
  name: 'git_checkout',
  description: 'Switch branches or restore files',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Branch name or file path to checkout'
      },
      create_new: {
        type: 'boolean',
        description: 'Create new branch and switch to it (-b flag)'
      }
    },
    required: ['target']
  },
  requiresConfirmation: true,
  execute: async (params: { target: string; create_new?: boolean }) => {
    try {
      let cmd = 'git checkout';

      if (params.create_new) {
        cmd += ' -b';
      }

      cmd += ` ${params.target}`;

      const result = execSync(cmd, {
        encoding: 'utf-8',
        cwd: process.cwd()
      });

      return result || `Switched to: ${params.target}`;
    } catch (error: any) {
      if (error.message.includes('pathspec')) {
        return `Error: Branch or file '${params.target}' not found`;
      }
      return `Error checking out: ${error.message}`;
    }
  }
};

export const gitTools = [
  gitStatusTool,
  gitDiffTool,
  gitLogTool,
  gitAddTool,
  gitCommitTool,
  gitPushTool,
  gitPullTool,
  gitBranchTool,
  gitCheckoutTool
];
