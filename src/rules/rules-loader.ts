import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getEsnaadPaths } from '../config.js';
import { RulesContext } from '../types.js';

/**
 * Load rules from global and project-level markdown files
 * Global: ~/.esnaad/rules.md
 * Project: ./ESNAAD.md (in project root)
 *
 * Project rules extend/override global rules
 */
export function loadRules(projectPath: string): RulesContext {
  const { globalRulesPath } = getEsnaadPaths();
  const projectRulesPath = join(projectPath, 'ESNAAD.md');

  let globalRules: string | null = null;
  let projectRules: string | null = null;

  // Load global rules
  if (existsSync(globalRulesPath)) {
    try {
      globalRules = readFileSync(globalRulesPath, 'utf-8').trim();
      if (globalRules.length === 0) {
        globalRules = null;
      }
    } catch (e) {
      // Silently ignore read errors for optional rules files
    }
  }

  // Load project rules
  if (existsSync(projectRulesPath)) {
    try {
      projectRules = readFileSync(projectRulesPath, 'utf-8').trim();
      if (projectRules.length === 0) {
        projectRules = null;
      }
    } catch (e) {
      // Silently ignore read errors for optional rules files
    }
  }

  // Combine rules (global first, then project)
  const parts: string[] = [];
  if (globalRules) {
    parts.push('## Global Rules\n\n' + globalRules);
  }
  if (projectRules) {
    parts.push('## Project Rules\n\n' + projectRules);
  }

  return {
    globalRules,
    projectRules,
    combinedRules: parts.join('\n\n')
  };
}
