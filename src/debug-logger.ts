import chalk from 'chalk';
import { DebugConfig, DebugType } from './types.js';

/**
 * Debug logger that filters output based on debug type
 */
export class DebugLogger {
  private config: DebugConfig;

  constructor(config: DebugConfig) {
    this.config = config;
  }

  /**
   * Log standard debug messages (shown when type is 'standard')
   */
  standard(message: string): void {
    if (!this.config.enabled) return;
    if (this.config.type !== 'standard') return;
    console.log(chalk.magenta(`[DEBUG] ${message}`));
  }

  /**
   * Log conversation data as JSON (shown when type is 'conversation')
   */
  conversation(label: string, data: any): void {
    if (!this.config.enabled) return;
    if (this.config.type !== 'conversation') return;
    console.log(chalk.cyan(`\n[CONVERSATION] ${label}:`));
    console.log(chalk.white(JSON.stringify(data, null, 2)));
  }

  /**
   * Check if standard debug is active
   */
  isStandardMode(): boolean {
    return this.config.enabled && this.config.type === 'standard';
  }

  /**
   * Check if conversation debug is active
   */
  isConversationMode(): boolean {
    return this.config.enabled && this.config.type === 'conversation';
  }

  /**
   * Get current debug type
   */
  getType(): DebugType {
    return this.config.type;
  }
}

/**
 * Create a debug logger instance
 */
export function createDebugLogger(type: DebugType = 'standard', enabled: boolean = true): DebugLogger {
  return new DebugLogger({ enabled, type });
}
