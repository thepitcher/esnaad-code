#!/usr/bin/env node

import { createInterface } from 'readline';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from './config.js';
import { Agent } from './agent.js';
import { MCPClient } from './mcp/client.js';

// Wrap in async IIFE to avoid top-level await warning
(async () => {

const program = new Command();

program
  .name('esnaad')
  .description('Esnaad Code - AI coding assistant with OpenAI')
  .version('1.0.0')
  .option('-m, --model <model>', 'OpenAI model to use')
  .option('-d, --directory <path>', 'Working directory', process.cwd())
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('\n🚀 Esnaad Code - AI Coding Assistant\n'));

      // Load configuration
      const config = loadConfig();

      if (options.model) {
        config.openai.model = options.model;
      }

      if (options.directory) {
        process.chdir(options.directory);
      }

      console.log(chalk.gray(`Model: ${config.openai.model}`));
      console.log(chalk.gray(`Working directory: ${process.cwd()}\n`));

      // Initialize MCP client
      const mcpClient = new MCPClient();
      if (config.mcpServers) {
        const spinner = ora('Connecting to MCP servers...').start();
        await mcpClient.initialize(config.mcpServers);
        spinner.succeed('MCP servers connected');
      }

      // Create readline interface
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.green('esnaad code> '),
        terminal: true  // Explicitly enable terminal mode for Windows
      });

      // Initialize agent with plan mode enabled by default
      const agent = new Agent(
        config.openai,
        mcpClient,
        { enabled: true, autoApproveReadOnly: true },
        rl
      );

      console.log(chalk.yellow('Type your request or /help for commands'));
      console.log(chalk.green('Plan mode: ON') + chalk.gray(' - destructive operations will require confirmation'));
      console.log(chalk.gray('Press Ctrl+C or type /exit to quit\n'));

      rl.prompt();

      // Handle Ctrl+C gracefully
      rl.on('SIGINT', () => {
        console.log(chalk.yellow('\n\nReceived Ctrl+C. Type /exit to quit or press Enter to continue.\n'));
        rl.prompt();
      });

      rl.on('line', async (line) => {
        const input = line.trim();

        if (!input) {
          rl.prompt();
          return;
        }

        // Handle commands
        if (input.startsWith('/')) {
          await handleCommand(input, agent, rl, mcpClient);
          return;
        }

        // Process user message
        // Note: ora spinner breaks stdin on Windows, so we use simple text instead
        console.log(chalk.yellow('Processing...'));
        try {
          const response = await agent.chat(input);
          console.log(chalk.blue('\n' + response + '\n'));
          console.log(chalk.gray('─'.repeat(60)));
        } catch (error: any) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
          console.log(chalk.gray('─'.repeat(60)));
        } finally {
          // Always show prompt again to continue the loop
          rl.prompt();
        }
      });

      // Create a promise that resolves when readline closes
      // This keeps the action function alive until user exits
      await new Promise<void>((resolve) => {
        rl.on('close', async () => {
          console.log(chalk.cyan('\n\nGoodbye! 👋\n'));
          await mcpClient.close();
          resolve();
        });
      });

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

async function handleCommand(
  input: string,
  agent: Agent,
  rl: any,
  mcpClient: MCPClient
): Promise<void> {
  const parts = input.slice(1).split(' ');
  const command = parts[0];

  switch (command) {
    case 'help':
      console.log(chalk.cyan('\nAvailable commands:'));
      console.log(chalk.white('  /help        - Show this help message'));
      console.log(chalk.white('  /clear       - Clear conversation history'));
      console.log(chalk.white('  /history     - Show conversation history'));
      console.log(chalk.white('  /plan        - Toggle or check plan mode status'));
      console.log(chalk.white('  /todos       - Show current task list'));
      console.log(chalk.white('  /todos clear - Clear the task list'));
      console.log(chalk.white('  /exit        - Exit Esnaad Code'));
      console.log(chalk.white('  /quit        - Exit Esnaad Code\n'));
      break;

    case 'clear':
      agent.clearHistory();
      console.log(chalk.yellow('\n✓ Conversation history cleared\n'));
      break;

    case 'history':
      const messages = agent.getMessages();
      console.log(chalk.cyan('\nConversation History:'));
      messages.forEach((msg, idx) => {
        if (msg.role === 'system') return;
        console.log(chalk.gray(`[${idx}] ${msg.role}: ${msg.content?.substring(0, 100)}...`));
      });
      console.log();
      break;

    case 'plan':
      const subCommand = parts[1];
      if (subCommand === 'on') {
        agent.setPlanMode(true);
        console.log(chalk.green('\n✓ Plan mode enabled - destructive operations will require confirmation\n'));
      } else if (subCommand === 'off') {
        agent.setPlanMode(false);
        console.log(chalk.yellow('\n✓ Plan mode disabled - all operations will execute immediately\n'));
      } else {
        const planStatus = agent.isPlanModeEnabled();
        console.log(chalk.cyan(`\nPlan mode is currently: ${planStatus ? chalk.green('ON') : chalk.yellow('OFF')}`));
        console.log(chalk.gray('  /plan on  - Enable plan mode (confirm destructive operations)'));
        console.log(chalk.gray('  /plan off - Disable plan mode (execute all immediately)\n'));
      }
      break;

    case 'todos':
      const { getTodoList, formatTodoList, clearTodoList } = await import('./tools/todo-tool.js');
      const todosSubCmd = parts[1];
      if (todosSubCmd === 'clear') {
        clearTodoList();
        console.log(chalk.yellow('\n✓ Todo list cleared\n'));
      } else {
        const todos = getTodoList();
        if (todos.length === 0) {
          console.log(chalk.gray('\nNo tasks in the todo list.\n'));
        } else {
          console.log('\n' + formatTodoList(todos) + '\n');
        }
      }
      break;

    case 'exit':
    case 'quit':
      rl.close();
      return;

    default:
      console.log(chalk.red(`\nUnknown command: ${command}`));
      console.log(chalk.gray('Type /help for available commands\n'));
  }

  rl.prompt();
}

// Use parseAsync() for async actions
await program.parseAsync();

})().catch((error) => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
