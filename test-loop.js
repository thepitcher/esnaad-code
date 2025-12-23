#!/usr/bin/env node

// Minimal test to verify the loop works
import { createInterface } from 'readline';
import chalk from 'chalk';

console.log(chalk.cyan('Test Loop - Minimal Version\n'));

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.green('test> ')
});

rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  if (input === '/exit') {
    rl.close();
    return;
  }

  console.log(chalk.blue(`You said: ${input}`));
  console.log(chalk.gray('─'.repeat(40)));
  rl.prompt();
});

// Keep the process alive
await new Promise((resolve) => {
  rl.on('close', () => {
    console.log(chalk.cyan('\nGoodbye!\n'));
    resolve();
  });
});

console.log('After promise - should only see this on exit');
