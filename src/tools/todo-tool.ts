import chalk from 'chalk';
import { Tool } from '../types.js';

// Types
export interface TodoItem {
  content: string;      // Imperative form: "Run tests"
  activeForm: string;   // Present continuous: "Running tests"
  status: 'pending' | 'in_progress' | 'completed';
}

// Module-level state (persists for session)
let todoList: TodoItem[] = [];

/**
 * Get the current todo list (returns a copy to prevent external mutation)
 */
export function getTodoList(): TodoItem[] {
  return [...todoList];
}

/**
 * Clear the todo list
 */
export function clearTodoList(): void {
  todoList = [];
}

/**
 * Format the todo list for display
 */
export function formatTodoList(todos: TodoItem[]): string {
  if (todos.length === 0) {
    return 'No tasks in the todo list.';
  }

  const lines: string[] = ['Current Tasks:'];

  for (const todo of todos) {
    let statusIcon: string;
    let line: string;

    switch (todo.status) {
      case 'pending':
        statusIcon = '[ ]';
        line = `  ${statusIcon} ${todo.content}`;
        break;
      case 'in_progress':
        statusIcon = '[*]';
        line = chalk.yellow(`  ${statusIcon} ${todo.activeForm}`);
        break;
      case 'completed':
        statusIcon = '[x]';
        line = chalk.green(`  ${statusIcon} ${todo.content}`);
        break;
    }

    lines.push(line);
  }

  return lines.join('\n');
}

export const todoWriteTool: Tool = {
  name: 'todo_write',
  description: `Manage a structured task list for tracking progress on complex tasks.

Use this tool when:
- Working on multi-step tasks (3+ steps)
- User provides multiple tasks to complete
- You want to track progress systematically

Each task has:
- content: Imperative form ("Run tests", "Fix bug")
- activeForm: Present continuous ("Running tests", "Fixing bug")
- status: "pending", "in_progress", or "completed"

Rules:
- Only ONE task should be "in_progress" at a time
- Mark tasks "completed" immediately after finishing
- The entire todo list is replaced on each call (full state replacement)`,

  inputSchema: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        description: 'The complete todo list (replaces existing list)',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Task in imperative form (e.g., "Run tests")'
            },
            activeForm: {
              type: 'string',
              description: 'Task in present continuous form (e.g., "Running tests")'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              description: 'Current status of the task'
            }
          },
          required: ['content', 'activeForm', 'status']
        }
      }
    },
    required: ['todos']
  },

  // No confirmation required - this is internal state management
  requiresConfirmation: false,

  execute: async (params: { todos: TodoItem[] }) => {
    // Validate input
    if (!params.todos || !Array.isArray(params.todos)) {
      return 'Error: todos must be an array';
    }

    const validStatuses = ['pending', 'in_progress', 'completed'];
    const warnings: string[] = [];

    // Validate each todo item
    for (let i = 0; i < params.todos.length; i++) {
      const todo = params.todos[i];

      if (!todo.content || typeof todo.content !== 'string') {
        return `Error: Todo item ${i + 1} missing required field "content"`;
      }
      if (!todo.activeForm || typeof todo.activeForm !== 'string') {
        return `Error: Todo item ${i + 1} missing required field "activeForm"`;
      }
      if (!todo.status || !validStatuses.includes(todo.status)) {
        return `Error: Todo item ${i + 1} has invalid status "${todo.status}". Must be: pending, in_progress, or completed`;
      }
    }

    // Check for multiple in_progress tasks (warn but don't reject)
    const inProgressCount = params.todos.filter(t => t.status === 'in_progress').length;
    if (inProgressCount > 1) {
      warnings.push(`Warning: ${inProgressCount} tasks are in_progress. Only one should be active at a time.`);
    }

    // Replace the entire todo list
    todoList = params.todos.map(todo => ({
      content: todo.content,
      activeForm: todo.activeForm,
      status: todo.status
    }));

    // Build response
    const parts: string[] = [];

    if (warnings.length > 0) {
      parts.push(warnings.join('\n'));
    }

    parts.push(`Todo list updated (${todoList.length} items)`);
    parts.push('');
    parts.push(formatTodoList(todoList));

    return parts.join('\n');
  }
};
