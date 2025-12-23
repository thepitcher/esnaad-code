import { Tool } from '../types.js';
import { getMemoryManager } from '../memory/memory-manager.js';

/**
 * Tool for agent to save important facts to persistent memory
 */
export const memorySaveTool: Tool = {
  name: 'memory_save',
  description: `Save important facts or context about this project to persistent memory.

Use this tool when you learn something important about the project that should be remembered for future sessions, such as:
- Key architectural decisions or patterns used
- Important file locations or conventions
- User preferences or coding style
- Critical dependencies or constraints
- Deployment or environment information
- Project-specific terminology or domain knowledge

The note will be stored persistently and loaded in future sessions.
Keep notes concise but informative. Avoid duplicates.`,

  inputSchema: {
    type: 'object',
    properties: {
      note: {
        type: 'string',
        description: 'The fact or context to remember (be concise but informative)'
      }
    },
    required: ['note']
  },

  requiresConfirmation: false,  // Auto-execute without confirmation

  execute: async (params: { note: string }): Promise<string> => {
    const manager = getMemoryManager();

    if (!manager) {
      return 'Error: Memory manager not initialized';
    }

    const note = params.note?.trim();
    if (!note || note.length === 0) {
      return 'Error: Note cannot be empty';
    }

    manager.addNote(note);
    return `Saved to project memory: "${note}"`;
  }
};
