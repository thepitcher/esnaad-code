import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { getEsnaadPaths, getProjectHash } from '../config.js';
import { MemoryContext } from '../types.js';

/**
 * Manages persistent project memory (notes/context)
 * Stores notes per-project in ~/.esnaad/memory/<project-hash>/notes.md
 */
export class MemoryManager {
  private projectId: string;
  private projectPath: string;
  private storagePath: string;
  private notes: string[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.projectId = getProjectHash(projectPath);
    const { memoryBasePath } = getEsnaadPaths();
    this.storagePath = join(memoryBasePath, this.projectId, 'notes.md');
    this.load();
  }

  /**
   * Load notes from disk
   */
  private load(): void {
    if (existsSync(this.storagePath)) {
      try {
        const content = readFileSync(this.storagePath, 'utf-8');
        // Parse markdown list format: - note text
        this.notes = content
          .split('\n')
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2).trim())
          .filter(note => note.length > 0);
      } catch (e) {
        // Start with empty notes if file can't be read
        this.notes = [];
      }
    }
  }

  /**
   * Save notes to disk
   */
  private save(): void {
    try {
      // Ensure directory exists
      const dir = dirname(this.storagePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Write as markdown list
      const content = this.notes.map(n => `- ${n}`).join('\n');
      writeFileSync(this.storagePath, content, 'utf-8');
    } catch (e) {
      console.error('Failed to save memory:', e);
    }
  }

  /**
   * Get all notes
   */
  getNotes(): string[] {
    return [...this.notes];
  }

  /**
   * Get memory context for injection into system prompt
   */
  getContext(): MemoryContext {
    return {
      projectId: this.projectId,
      projectPath: this.projectPath,
      notes: this.getNotes(),
      storagePath: this.storagePath
    };
  }

  /**
   * Add a new note (avoids duplicates)
   */
  addNote(note: string): void {
    const trimmed = note.trim();
    if (trimmed && !this.notes.includes(trimmed)) {
      this.notes.push(trimmed);
      this.save();
    }
  }

  /**
   * Remove a note by index
   */
  removeNote(index: number): boolean {
    if (index >= 0 && index < this.notes.length) {
      this.notes.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Clear all notes
   */
  clear(): void {
    this.notes = [];
    this.save();
  }
}

// Singleton instance for access from tools
let memoryManagerInstance: MemoryManager | null = null;

/**
 * Initialize the memory manager (called at CLI startup)
 */
export function initMemoryManager(projectPath: string): MemoryManager {
  memoryManagerInstance = new MemoryManager(projectPath);
  return memoryManagerInstance;
}

/**
 * Get the current memory manager instance (used by memory_save tool)
 */
export function getMemoryManager(): MemoryManager | null {
  return memoryManagerInstance;
}
