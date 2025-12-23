# Esnaad Code - Project Summary & Session History

## Project Overview

**Project Name**: Esnaad Code
**Purpose**: A command-line AI coding assistant similar to Claude Code, but powered by OpenAI's API
**Target Platform**: Windows (with cross-platform support)
**Status**: ✅ Fully functional with continuous loop working on Windows

## What Was Built

### Core Features Implemented

1. **File Manipulation Tools**
   - `read` - Read file contents with line numbers
   - `write` - Create or overwrite files
   - `edit` - Replace text in files (supports replace-all)
   - `glob` - Find files using glob patterns (e.g., `**/*.ts`)
   - `grep` - Search code using ripgrep (with Windows-specific handling)

2. **Shell Execution**
   - `bash` - Execute shell commands (works with CMD/PowerShell on Windows)
   - Timeout support and error handling

3. **MCP (Model Context Protocol) Support**
   - Client implementation to connect to MCP servers
   - Automatic tool discovery from connected servers
   - Support for multiple MCP servers simultaneously

4. **OpenAI Integration**
   - Supports GPT-4, GPT-3.5, and other OpenAI models
   - Configurable via environment variables
   - Tool calling with automatic iteration
   - Conversation history management

5. **Interactive CLI**
   - REPL interface with colored output (using chalk)
   - Command system (`/help`, `/clear`, `/history`, `/exit`)
   - Continuous loop that runs until user exits
   - Works correctly on Windows (after fixing critical bugs)

### Architecture

```
esnaad-code/
├── src/
│   ├── agent.ts          # Core agent with OpenAI integration & tool calling
│   ├── cli.ts            # Main interactive CLI (production)
│   ├── cli-debug.ts      # Debug version with extensive logging
│   ├── config.ts         # Configuration management (.env + ~/.esnaad/config.json)
│   ├── types.ts          # TypeScript type definitions
│   ├── tools/
│   │   ├── file-tools.ts # File operations (read, write, edit, glob, grep)
│   │   ├── bash-tool.ts  # Shell command execution
│   │   └── index.ts      # Tool registry and OpenAI format conversion
│   └── mcp/
│       └── client.ts     # MCP client for external tools
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
├── claude.md             # Session context for future Claude sessions
├── README.md             # Main documentation
├── WINDOWS.md            # Windows-specific setup guide
├── UPDATE-INSTRUCTIONS.md # How to update after pulling changes
├── rebuild.sh/bat        # Rebuild and relink scripts
└── check-installation.bat # Installation verification script
```

## Critical Issues Encountered & Solutions

### Issue #1: CLI Exiting After First Response (The Loop Bug)

**Problem**: The CLI would accept one message, respond, and then immediately exit to the shell instead of continuing the loop.

**Root Causes Found**:

1. **Commander.js Async Action Not Awaited**
   - **Symptom**: Using `program.parse()` instead of `program.parseAsync()`
   - **Fix**: Changed to `await program.parseAsync()` (line 161 of cli.ts)
   - **Why**: Commander.js wasn't waiting for the async action to complete

2. **Async Action Completing Too Early**
   - **Symptom**: The action function returned after setting up event listeners
   - **Fix**: Added a Promise that only resolves when readline closes (lines 97-105 of cli.ts)
   ```typescript
   await new Promise<void>((resolve) => {
     rl.on('close', async () => {
       await mcpClient.close();
       resolve();
     });
   });
   ```
   - **Why**: Keeps the async action alive until user explicitly exits

3. **Ora Spinner Breaking stdin on Windows** ⚠️ **CRITICAL WINDOWS BUG**
   - **Symptom**: Even with fixes #1 and #2, the loop still exited on Windows
   - **Discovery**: Debug version without ora spinner worked perfectly
   - **Fix**: Removed ora spinner, replaced with simple `console.log('Processing...')`
   - **Why**: Ora spinner interferes with stdin on Windows, causing it to close
   - **Location**: cli.ts lines 85-86
   - **Documented**: claude.md Known Windows-Specific Issues #4

**Solution Summary**: All three fixes were required:
1. Use `parseAsync()` instead of `parse()`
2. Keep action alive with Promise that waits for readline close
3. Remove ora spinner on Windows (use simple text output)

### Issue #2: Top-Level Await Warning

**Problem**: Node.js warned about "unsettled top-level await"

**Fix**: Wrapped entire script in async IIFE (Immediately Invoked Function Expression):
```typescript
(async () => {
  // all code here
  await program.parseAsync();
})().catch((error) => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});
```

### Issue #3: Multiple Installation Paths

**Problem**: User had two installations (C:\Workspace\esnaad-code and c:\temp\esnaad-code), and `npm link` was pointing to the wrong one

**Fix**: Created `check-installation.bat` script to verify which installation is active

**Prevention**: Always run `npm unlink -g esnaad && npm link` after pulling changes

## Windows-Specific Considerations

### Critical Windows Issues Solved

1. ✅ **Ora Spinner** - Breaks stdin, removed from production CLI
2. ✅ **Ripgrep** - Platform detection added, helpful error messages with Windows installation instructions
3. ✅ **File Paths** - Works with both forward slashes and backslashes
4. ✅ **Shell Commands** - Uses `exec` which works with CMD/PowerShell

### Windows Setup Requirements

**Required**:
- Node.js v18+
- npm (comes with Node.js)
- OpenAI API Key

**Optional but Recommended**:
- ripgrep (install via Chocolatey or Scoop)

**Installation Steps** (see WINDOWS.md for details):
```powershell
npm install
npm run build
npm link
```

**Configuration**:
- Environment: `.env` file in project root
- MCP Servers: `C:\Users\YourUsername\.esnaad\config.json`

## Key Architectural Decisions

### 1. Why OpenAI Instead of Anthropic?
- User requested OpenAI-compatible API support
- Allows use of OpenAI, Azure OpenAI, or any OpenAI-compatible endpoint

### 2. Why TypeScript?
- Type safety
- Better IDE support
- Modern JavaScript features
- Compiles to clean JavaScript for distribution

### 3. Why Readline Instead of Other CLI Libraries?
- Built into Node.js (no extra dependencies)
- Works well on Windows
- Simple event-driven model
- Well-documented

### 4. Why Remove Ora Spinner?
- **Critical**: Breaks stdin on Windows (causes loop exit)
- Not essential for functionality
- Simple text output works fine
- Windows compatibility > fancy UI

### 5. Why MCP Support?
- Extensibility - users can add custom tools
- Follows industry standard (Anthropic's MCP)
- Allows connection to existing MCP servers

## How to Use

### Quick Start
```powershell
# Windows
esnaad

# Then interact
esnaad> help me create a new file
esnaad> read package.json
esnaad> find all .ts files
esnaad> /exit
```

### Available Commands
- `/help` - Show available commands
- `/clear` - Clear conversation history
- `/history` - Show conversation history
- `/exit` or `/quit` - Exit Esnaad Code
- Ctrl+D - Also exits

### Configuration

**Environment Variables (.env)**:
```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_API_BASE=https://api.openai.com/v1  # Optional
```

**MCP Servers (~/.esnaad/config.json)**:
```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\YourName\\Projects"]
    }
  ]
}
```

## Development Workflow

### Building
```bash
npm run build        # Build TypeScript
npm run dev          # Build and run
npm run debug        # Run debug version with logging
```

### Testing the Loop
```powershell
esnaad-debug         # Debug version with extensive logging
esnaad               # Production version
```

### Making Changes
```bash
# 1. Make code changes
# 2. Build
npm run build
# 3. Test (if globally linked, no need to relink)
esnaad
# 4. Commit and push
git add -A
git commit -m "Description"
git push
```

### After Pulling Changes
```powershell
git pull
npm run build
npm link             # Relink if needed
```

Or use the rebuild script:
```powershell
.\rebuild.bat        # Windows
./rebuild.sh         # Linux/macOS
```

## Git History Summary

Key commits in order:

1. `6ca01a0` - Initial implementation of Esnaad Code
2. `2db55d8` - Enhanced continuous loop functionality
3. `77c7119` - Added comprehensive Windows support and documentation
4. `8c17300` - Fixed loop exit bug with Promise approach
5. `4eaf77d` - Removed top-level await warning with async IIFE
6. `833d690` - Added installation checker script
7. `8ff0562` - Added debug version with terminal mode fix
8. `c36b519` - Enhanced debug with stdin state checks
9. `96c240d` - **CRITICAL FIX**: Removed ora spinner to fix Windows loop

## Current State

✅ **Fully Functional**
- All core features implemented
- Continuous loop works on Windows
- File operations work correctly
- MCP support functional
- OpenAI integration working
- Command system working

✅ **Well Documented**
- README.md - Main documentation
- WINDOWS.md - Windows-specific guide
- claude.md - Session context for future sessions
- UPDATE-INSTRUCTIONS.md - Update procedures
- This file - Complete project history

✅ **Production Ready**
- Can be installed globally with `npm link`
- Works on Windows (primary target)
- Cross-platform compatible
- Error handling in place
- Configuration management working

## Future Enhancements (Not Yet Implemented)

From claude.md:
- [ ] Windows-native grep implementation (fallback when ripgrep not available)
- [ ] Cross-platform path handling utilities
- [ ] Better Windows CMD/PowerShell command support
- [ ] Installation script for Windows (with ripgrep setup)
- [ ] Executable packaging for Windows (.exe)
- [ ] WSL detection and optimization

## Important Files for Future Sessions

1. **claude.md** - Technical context, known issues, architecture
2. **This file** - Complete history and journey
3. **README.md** - User-facing documentation
4. **WINDOWS.md** - Windows setup guide
5. **src/cli.ts** - Main CLI implementation (lines 85-86: no spinner!)
6. **src/agent.ts** - Core agent logic
7. **src/tools/** - Tool implementations

## Debugging Tips

### If Loop Exits After First Response:
1. Check if ora spinner was re-added (line ~85 in cli.ts)
2. Verify `parseAsync()` is used (line ~161 in cli.ts)
3. Verify Promise is present (lines ~97-105 in cli.ts)
4. Run `esnaad-debug` to see detailed logs

### If Command Not Found:
1. Run `where esnaad` to see which installation is active
2. Run `.\check-installation.bat` to verify paths
3. Relink: `npm unlink -g esnaad && npm link`

### If Changes Don't Take Effect:
1. Rebuild: `npm run build`
2. Check dist/ folder has new timestamp
3. Relink if needed: `npm link`

## Success Metrics

✅ User can type multiple messages in one session
✅ Works on Windows without issues
✅ Easy to configure with .env file
✅ Extensible with MCP servers
✅ File operations work correctly
✅ Shell commands execute properly
✅ Documentation is comprehensive
✅ Loop continues until explicit exit

## Lessons Learned

1. **Windows is different**: Libraries that work on Linux/macOS may break on Windows
2. **Ora spinner issue**: Spinner libraries can interfere with stdin on Windows
3. **Commander.js async**: Must use `parseAsync()` for async actions
4. **Event-driven architecture**: Need to keep event loop alive with Promises
5. **Debug versions**: Essential for diagnosing platform-specific issues
6. **Documentation**: Critical to document Windows-specific workarounds
7. **Multiple installations**: Users may have multiple versions, provide verification tools

## Quick Reference

**Start using**:
```powershell
esnaad
```

**Debug issues**:
```powershell
esnaad-debug
```

**Rebuild after changes**:
```powershell
npm run build
```

**Check installation**:
```powershell
.\check-installation.bat
```

**View logs/help**:
```
esnaad> /help
esnaad> /history
esnaad> /exit
```

---

**Last Updated**: 2024 (Session with successful Windows loop fix)
**Branch**: claude/basic-coding-agent-1xb8N
**Status**: Production Ready ✅
