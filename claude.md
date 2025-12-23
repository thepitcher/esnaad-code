# Claude Code Session Context

## Project: Esnaad Code - AI Coding Assistant

**📋 For complete project history and detailed summary, see [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md)**

### Target Environment
**IMPORTANT: Target environment is Windows**

All development and testing should prioritize Windows compatibility:
- File paths should work on Windows (support both `\` and `/`)
- Shell commands should be Windows-compatible
- Dependencies should have Windows alternatives where needed
- Installation instructions should include Windows-specific steps

### Project Overview
Esnaad Code is a command-line AI coding assistant similar to Claude Code, but powered by OpenAI's API instead of Anthropic's Claude.

### Key Features
1. **File Operations**: Read, write, edit, glob, grep
2. **Shell Execution**: Execute bash/cmd commands
3. **MCP Support**: Model Context Protocol for extensibility
4. **OpenAI Integration**: GPT-4, GPT-3.5, and compatible models
5. **Continuous Loop**: Interactive REPL that runs until user exits
6. **Plan Mode**: Confirmation required for destructive operations (write, edit, bash, git mutations)
7. **Persistent Memory**: Project context/notes stored per-project, auto-save + manual
8. **Rules System**: Global + project-level markdown rules injected into agent

### Technology Stack
- **Language**: TypeScript/Node.js
- **AI Provider**: OpenAI API
- **CLI Framework**: Commander.js
- **UI**: Chalk (colors), Ora (spinners)
- **MCP**: @modelcontextprotocol/sdk

### Architecture
```
src/
├── agent.ts          # Core agent with OpenAI integration + plan mode
├── cli.ts            # Interactive CLI with continuous loop
├── config.ts         # Configuration management
├── types.ts          # TypeScript definitions
├── plan-review.ts    # Plan mode UI for reviewing/approving operations
├── rules/
│   └── rules-loader.ts  # Load global + project rules
├── memory/
│   └── memory-manager.ts # Persistent project memory
├── tools/
│   ├── file-tools.ts # Read, write, edit, glob, grep (w/ requiresConfirmation)
│   ├── bash-tool.ts  # Shell command execution (w/ requiresConfirmation)
│   ├── git-tool.ts   # Git operations (status, diff, log, commit, push, etc.)
│   ├── memory-tool.ts # memory_save tool for auto-saving context
│   └── index.ts      # Tool registry
└── mcp/
    └── client.ts     # MCP client for external tools
```

### Important Implementation Notes

#### Continuous Loop
The CLI runs in a continuous loop using Node.js readline:
- `rl.on('line', ...)` event listener processes each user input
- `rl.prompt()` is called after every response to continue the loop
- Loop continues until `/exit`, `/quit`, or Ctrl+D

**CRITICAL**: Two fixes required for the loop to work:
1. **Promise in action** (lines 97-105 of cli.ts): Keeps the async action alive
   ```typescript
   await new Promise<void>((resolve) => {
     rl.on('close', async () => {
       await mcpClient.close();
       resolve();
     });
   });
   ```
2. **parseAsync()** (line 161 of cli.ts): Commander.js must await the async action
   ```typescript
   await program.parseAsync();  // NOT program.parse()
   ```

Without both fixes, the program exits after the first response!

#### Plan Mode Implementation
The CLI includes a plan mode feature that requires user confirmation for destructive operations:

**Tools requiring confirmation** (marked with `requiresConfirmation: true`):
- `write`, `edit` (file modifications)
- `bash` (shell commands)
- `git_add`, `git_commit`, `git_push`, `git_pull`, `git_branch`, `git_checkout`

**Tools that auto-execute** (read-only):
- `read`, `glob`, `grep`
- `git_status`, `git_diff`, `git_log`

**User interaction**:
- `y` - Accept all pending operations
- `n` - Reject all operations
- `s` - Step-by-step review with parameter editing option

**Commands**:
- `/plan` - Show current status
- `/plan on` - Enable (default)
- `/plan off` - Disable (auto-execute all)

#### Windows Compatibility Considerations
1. **Grep Tool**: Uses `rg` (ripgrep) - needs to be installed on Windows or provide fallback
2. **File Paths**: Should handle both Windows (`\`) and Unix (`/`) path separators
3. **Shell Commands**: `bash-tool.ts` uses `exec` which works on Windows CMD/PowerShell
4. **Line Endings**: Be aware of CRLF vs LF differences

#### Configuration
- **Environment**: `.env` file for OpenAI API key
- **MCP Servers**: `~/.esnaad/config.json` for MCP server configuration
- **API**: Supports custom OpenAI-compatible endpoints

#### Persistent Memory System
Memory stores project context/notes that persist across sessions:

**Storage**: `~/.esnaad/memory/<project-hash>/notes.md`

**How it works**:
- Agent can auto-save facts using `memory_save` tool
- User can manually save with `/remember <note>` command
- Notes are injected into system prompt on startup
- Each project has its own memory (based on path hash)

**Commands**:
- `/remember <note>` - Save a note to project memory
- `/memory` - Show all stored notes
- `/memory clear` - Clear all notes for current project

#### Rules System
Rules define instructions that the agent follows:

**File Locations**:
- Global rules: `~/.esnaad/rules.md` (applies to all projects)
- Project rules: `ESNAAD.md` in project root (extends/overrides global)

**Format**: Markdown files that users can edit directly

**How it works**:
- Rules are loaded at startup
- Both global and project rules are merged
- Injected into agent's system prompt
- Project rules appear after global rules (can override)

**Commands**:
- `/rules` - Show loaded rules

**Example `~/.esnaad/rules.md`**:
```markdown
# Global Rules
- Always use TypeScript
- Run tests after changes
- Write clear commit messages
```

**Example `ESNAAD.md`**:
```markdown
# Project Rules
- Use repository pattern for data access
- All API routes go in src/routes/
- Target Node.js 18+
```

### Development Workflow
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm start            # Run the CLI
npm run dev          # Build and run
```

### Git Branch
- Main development branch: `claude/basic-coding-agent-1xb8N`
- Always commit and push changes to this branch

### Future Enhancements to Consider
- [ ] Windows-native grep implementation (fallback when ripgrep not available)
- [ ] Cross-platform path handling utilities
- [ ] Better Windows CMD/PowerShell command support
- [ ] Installation script for Windows (with ripgrep setup)
- [ ] Executable packaging for Windows (.exe)
- [ ] WSL detection and optimization

### Testing Checklist for Windows
- [ ] File paths work correctly (forward and backslashes)
- [ ] Shell commands execute properly in CMD/PowerShell
- [ ] Ripgrep is installed or fallback is available
- [ ] MCP servers can launch on Windows
- [ ] Configuration file paths resolve correctly (~/.esnaad/)
- [ ] Line endings handled properly (CRLF)

### Known Windows-Specific Issues
1. **Ripgrep**: Not installed by default - need installation instructions
2. **Home Directory**: `~/.esnaad/` needs proper Windows path resolution
3. **Shell**: Bash commands might need CMD/PowerShell equivalents
4. **Ora Spinner**: The `ora` spinner library breaks stdin on Windows, causing the CLI to exit after first response. **SOLUTION**: Removed spinner, use simple text output instead (see cli.ts line 85-86)

### Session Reminders
- Always test on Windows or consider Windows compatibility
- Update this file when making architectural changes
- Keep Windows-specific workarounds documented
