import chalk from 'chalk';
import { Interface as ReadlineInterface } from 'readline';
import { PendingOperation, PlanReviewResult, StepResult } from './types.js';

/**
 * Truncate a string to a maximum length
 */
function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
}

/**
 * Formats a pending operation for display to the user
 */
export function formatOperationForDisplay(op: PendingOperation): string {
  switch (op.toolName) {
    case 'write':
      return `write: ${op.params.file_path} (${op.params.content?.length || 0} chars)`;
    case 'edit':
      return `edit: ${op.params.file_path} - replace "${truncate(op.params.old_string, 30)}"`;
    case 'bash':
      return `bash: ${truncate(op.params.command, 60)}`;
    case 'git_add':
      return `git add: ${op.params.files}`;
    case 'git_commit':
      return `git commit: "${truncate(op.params.message, 50)}"`;
    case 'git_push':
      return `git push: ${op.params.remote || 'origin'} ${op.params.branch || '(current)'}`;
    case 'git_pull':
      return `git pull: ${op.params.remote || 'origin'} ${op.params.branch || '(current)'}`;
    case 'git_branch':
      return `git branch: ${op.params.action} ${op.params.branch_name || ''}`;
    case 'git_checkout':
      return `git checkout: ${op.params.target}${op.params.create_new ? ' (new)' : ''}`;
    default:
      return `${op.toolName}: ${JSON.stringify(op.params).substring(0, 60)}`;
  }
}

/**
 * Promise-based question helper
 */
function question(rl: ReadlineInterface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Display the plan and get user decision
 */
export async function reviewPlan(
  operations: PendingOperation[],
  rl: ReadlineInterface
): Promise<PlanReviewResult> {
  // Display the plan
  console.log(chalk.yellow('\n=== Plan Review ==='));
  console.log(chalk.gray('The following operations require confirmation:\n'));

  operations.forEach((op, idx) => {
    console.log(chalk.white(`  ${idx + 1}. ${formatOperationForDisplay(op)}`));
  });

  console.log();
  console.log(chalk.cyan('Options:'));
  console.log(chalk.white('  y - Accept all operations'));
  console.log(chalk.white('  n - Reject all operations'));
  console.log(chalk.white('  s - Review step-by-step'));
  console.log();

  const answer = await question(rl, chalk.green('Your choice (y/n/s): '));

  switch (answer.toLowerCase()) {
    case 'y':
      return { action: 'accept_all' };
    case 'n':
      return { action: 'reject_all' };
    case 's':
      const results = await reviewStepByStep(operations, rl);
      return { action: 'step_results', results };
    default:
      console.log(chalk.red('Invalid choice. Rejecting all operations.'));
      return { action: 'reject_all' };
  }
}

/**
 * Review operations one by one
 */
async function reviewStepByStep(
  operations: PendingOperation[],
  rl: ReadlineInterface
): Promise<StepResult[]> {
  const results: StepResult[] = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    console.log(chalk.yellow(`\n--- Step ${i + 1}/${operations.length} ---`));
    console.log(chalk.white(`Tool: ${op.toolName}`));
    console.log(chalk.white('Parameters:'));
    console.log(chalk.gray(JSON.stringify(op.params, null, 2)));
    console.log();
    console.log(chalk.cyan('  y - Accept this step'));
    console.log(chalk.cyan('  n - Reject this step'));
    console.log(chalk.cyan('  e - Edit parameters'));

    const answer = await question(rl, chalk.green('Choice (y/n/e): '));

    switch (answer.toLowerCase()) {
      case 'y':
        results.push({ toolCallId: op.toolCallId, action: 'accept' });
        break;
      case 'n':
        results.push({ toolCallId: op.toolCallId, action: 'reject' });
        break;
      case 'e':
        const editedParams = await editParameters(op.params, rl);
        results.push({ toolCallId: op.toolCallId, action: 'edit', editedParams });
        break;
      default:
        console.log(chalk.red('Invalid choice. Rejecting this step.'));
        results.push({ toolCallId: op.toolCallId, action: 'reject' });
    }
  }

  return results;
}

/**
 * Allow user to edit parameters (simple JSON editing)
 */
async function editParameters(
  params: Record<string, any>,
  rl: ReadlineInterface
): Promise<Record<string, any>> {
  console.log(chalk.yellow('\nEditing parameters:'));
  const editedParams = { ...params };

  for (const [key, value] of Object.entries(params)) {
    const displayValue = typeof value === 'string'
      ? truncate(value, 50)
      : JSON.stringify(value);

    console.log(chalk.gray(`Current ${key}: ${displayValue}`));
    const newValue = await question(rl, chalk.green(`New ${key} (Enter to keep): `));

    if (newValue.trim()) {
      // Try to parse as JSON first, fallback to string
      try {
        editedParams[key] = JSON.parse(newValue);
      } catch {
        editedParams[key] = newValue;
      }
    }
  }

  return editedParams;
}
