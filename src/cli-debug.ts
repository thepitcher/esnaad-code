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
  .name('esnaad-debug')
  .description('Esnaad Code - Debug version')
  .version('1.0.0')
  .option('-m, --model <model>', 'OpenAI model to use')
  .option('-d, --directory <path>', 'Working directory', process.cwd())
  .action(async (options) => {
    try {
      console.log(chalk.cyan.bold('\n🚀 Esnaad Code - Debug Version\n'));

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

      // Initialize agent
      const agent = new Agent(config.openai, mcpClient);

      // Create readline interface
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.green('esnaad> '),
        terminal: true
      });

      console.log(chalk.yellow('Type your request or /help for commands'));
      console.log(chalk.gray('Press Ctrl+C or type /exit to quit\n'));

      console.log(chalk.magenta('[DEBUG] Readline interface created'));
      console.log(chalk.magenta('[DEBUG] stdin.isTTY:', process.stdin.isTTY));
      console.log(chalk.magenta('[DEBUG] stdout.isTTY:', process.stdout.isTTY));

      // Keep stdin in flowing mode (important for Windows)
      process.stdin.resume();
      console.log(chalk.magenta('[DEBUG] Called stdin.resume()'));

      // Monitor stdin close
      process.stdin.on('end', () => {
        console.log(chalk.red('\n[DEBUG] stdin END event fired!'));
      });

      process.stdin.on('close', () => {
        console.log(chalk.red('\n[DEBUG] stdin CLOSE event fired!'));
      });

      rl.on('close', () => {
        console.log(chalk.red('\n[DEBUG] readline CLOSE event fired!'));
      });

      rl.prompt();
      console.log(chalk.magenta('[DEBUG] First prompt shown'));

      // Handle Ctrl+C gracefully
      rl.on('SIGINT', () => {
        console.log(chalk.yellow('\n\nReceived Ctrl+C. Type /exit to quit or press Enter to continue.\n'));
        rl.prompt();
      });

      rl.on('line', async (line) => {
        console.log(chalk.magenta(`[DEBUG] Received line: "${line}"`));
        const input = line.trim();

        if (!input) {
          console.log(chalk.magenta('[DEBUG] Empty input, showing prompt again'));
          rl.prompt();
          return;
        }

        // Handle commands
        if (input.startsWith('/')) {
          if (input === '/exit' || input === '/quit') {
            console.log(chalk.magenta('[DEBUG] Exit command received, closing readline'));
            rl.close();
            return;
          }
          console.log(chalk.blue('Command received (not implemented in debug mode)'));
          rl.prompt();
          return;
        }

        // Process user message
        console.log(chalk.magenta('[DEBUG] Processing message...'));
        // NO SPINNER - testing if ora breaks stdin on Windows
        console.log(chalk.yellow('Processing (no spinner)...'));
        try {
          const response = await agent.chat(input);
          console.log(chalk.magenta('[DEBUG] Got response, displaying...'));
          console.log(chalk.blue('\n' + response + '\n'));
          console.log(chalk.gray('─'.repeat(60)));
        } catch (error: any) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
          console.log(chalk.gray('─'.repeat(60)));
        } finally {
          console.log(chalk.magenta('[DEBUG] About to show prompt again'));

          // Check stdin state before prompting
          console.log(chalk.magenta('[DEBUG] stdin.readable:', process.stdin.readable));
          console.log(chalk.magenta('[DEBUG] stdin.readableEnded:', process.stdin.readableEnded));
          console.log(chalk.magenta('[DEBUG] stdin.destroyed:', process.stdin.destroyed));

          // Always show prompt again to continue the loop
          rl.prompt();
          console.log(chalk.magenta('[DEBUG] Prompt shown, waiting for next input'));

          // Force a pause to keep stdin active
          setImmediate(() => {
            console.log(chalk.magenta('[DEBUG] setImmediate callback executed'));
          });
        }
      });

      // Create a promise that resolves when readline closes
      // This keeps the action function alive until user exits
      console.log(chalk.magenta('[DEBUG] Setting up Promise to keep process alive'));
      await new Promise<void>((resolve) => {
        rl.on('close', async () => {
          console.log(chalk.cyan('\n\nGoodbye! 👋\n'));
          console.log(chalk.magenta('[DEBUG] In close handler, cleaning up...'));
          await mcpClient.close();
          console.log(chalk.magenta('[DEBUG] Resolving Promise...'));
          resolve();
        });
      });

      console.log(chalk.magenta('[DEBUG] Promise resolved, exiting...'));

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

function handleCommand(
  input: string,
  agent: Agent,
  rl: any,
  mcpClient: MCPClient
): void {
  const parts = input.slice(1).split(' ');
  const command = parts[0];

  switch (command) {
    case 'help':
      console.log(chalk.cyan('\nAvailable commands:'));
      console.log(chalk.white('  /help     - Show this help message'));
      console.log(chalk.white('  /clear    - Clear conversation history'));
      console.log(chalk.white('  /history  - Show conversation history'));
      console.log(chalk.white('  /exit     - Exit Esnaad Code'));
      console.log(chalk.white('  /quit     - Exit Esnaad Code\n'));
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
