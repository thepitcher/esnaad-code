import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import dotenv from 'dotenv';
import { Config } from './types.js';

dotenv.config();

export function loadConfig(): Config {
  const configPath = join(homedir(), '.esnaad', 'config.json');

  let mcpServers = undefined;
  if (existsSync(configPath)) {
    try {
      const configFile = JSON.parse(readFileSync(configPath, 'utf-8'));
      mcpServers = configFile.mcpServers;
    } catch (error) {
      console.warn('Failed to load config file:', error);
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return {
    openai: {
      apiKey,
      apiBase: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      orgId: process.env.OPENAI_ORG_ID,
      maxIterations: 50
    },
    mcpServers
  };
}
