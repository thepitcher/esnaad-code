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

### Technology Stack
- **Language**: TypeScript/Node.js
- **AI Provider**: OpenAI API
- **CLI Framework**: Commander.js
- **UI**: Chalk (colors), Ora (spinners)
- **MCP**: @modelcontextprotocol/sdk

### Architecture
```
src/
├── agent.ts          # Core agent with OpenAI integration
├── cli.ts            # Interactive CLI with continuous loop
├── config.ts         # Configuration management
├── types.ts          # TypeScript definitions
├── tools/
│   ├── file-tools.ts # Read, write, edit, glob, grep
│   ├── bash-tool.ts  # Shell command execution
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

#### Windows Compatibility Considerations
1. **Grep Tool**: Uses `rg` (ripgrep) - needs to be installed on Windows or provide fallback
2. **File Paths**: Should handle both Windows (`\`) and Unix (`/`) path separators
3. **Shell Commands**: `bash-tool.ts` uses `exec` which works on Windows CMD/PowerShell
4. **Line Endings**: Be aware of CRLF vs LF differences

#### Configuration
- **Environment**: `.env` file for OpenAI API key
- **MCP Servers**: `~/.esnaad/config.json` for MCP server configuration
- **API**: Supports custom OpenAI-compatible endpoints

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
