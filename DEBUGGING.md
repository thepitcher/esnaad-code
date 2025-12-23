# Debugging Esnaad Code in VS Code

This guide explains how to debug Esnaad Code using Visual Studio Code.

## Prerequisites

1. **VS Code** installed
2. **Node.js** v18+ installed
3. **Project dependencies** installed: `npm install`
4. **Build completed**: `npm run build`

## Debug Configurations

I've set up 5 debug configurations in `.vscode/launch.json`:

### 1. **Debug Esnaad Code** (Recommended)
- **What it does**: Builds TypeScript, then debugs the compiled JavaScript
- **Best for**: Normal debugging workflow
- **How to use**:
  1. Set breakpoints in your `.ts` files (e.g., `src/cli.ts`, `src/agent.ts`)
  2. Press `F5` or click "Run and Debug" → "Debug Esnaad Code"
  3. The app will build automatically, then start in the integrated terminal
  4. Type your commands interactively
  5. VS Code will pause at breakpoints (works with source maps)

### 2. **Debug Esnaad Code (No Build)**
- **What it does**: Debugs without building first
- **Best for**: Quick debugging when you know the build is up to date
- **How to use**: Same as above, but skips the build step

### 3. **Debug Esnaad (Debug Version)**
- **What it does**: Runs the debug version with extra logging
- **Best for**: Investigating the Windows loop issue or stdin problems
- **How to use**: Select this config and press `F5`
- **Note**: You'll see `[DEBUG]` messages in addition to breakpoints

### 4. **Debug TypeScript Directly (ts-node)**
- **What it does**: Runs TypeScript directly without compiling
- **Best for**: Quick iterations without waiting for build
- **Requires**: `npm install` (ts-node is in devDependencies)
- **How to use**: Select this config and press `F5`
- **Note**: Slower startup but no build step needed

### 5. **Debug Current TypeScript File**
- **What it does**: Debugs whichever `.ts` file you have open
- **Best for**: Testing individual modules or utilities
- **How to use**:
  1. Open a TypeScript file (e.g., `src/tools/file-tools.ts`)
  2. Select this config
  3. Press `F5`

## Quick Start

### Basic Debugging Workflow

1. **Open the project in VS Code**:
   ```powershell
   cd C:\Workspace\esnaad-code
   code .
   ```

2. **Set breakpoints**:
   - Click in the gutter (left of line numbers) in any `.ts` file
   - Or press `F9` on a line
   - Common places to set breakpoints:
     - `src/cli.ts` line 87 - When processing user message
     - `src/agent.ts` line 76 - When calling OpenAI API
     - `src/tools/file-tools.ts` - In any tool execution

3. **Start debugging**:
   - Press `F5`
   - Or click "Run and Debug" in the left sidebar
   - Or press `Ctrl+Shift+D` then `F5`

4. **Interact with the debugger**:
   - When it hits a breakpoint, the code pauses
   - Hover over variables to see their values
   - Use the Debug Console to evaluate expressions
   - Step through code with:
     - `F10` - Step over (execute current line)
     - `F11` - Step into (enter function calls)
     - `Shift+F11` - Step out (exit current function)
     - `F5` - Continue (run until next breakpoint)

5. **Debug the loop**:
   - Set a breakpoint at `src/cli.ts` line 93 (`rl.prompt()`)
   - Start debugging
   - Type a message and press Enter
   - Watch the code flow through the async chat function
   - See the prompt being shown again

## Debugging Specific Issues

### Debugging the Windows Loop Bug

If you suspect the loop is breaking:

1. Set breakpoints at:
   - `src/cli.ts` line 70 - `rl.on('line'...`
   - `src/cli.ts` line 93 - `rl.prompt()` (in finally block)
   - `src/cli.ts` line 100 - `rl.on('close'...`

2. Start debugging
3. Type a message
4. Watch the execution flow:
   - Should hit line 70 (line event)
   - Should process the message
   - Should hit line 93 (prompt shown again)
   - Should NOT hit line 100 (close event) unless you type `/exit`

If it hits the close event unexpectedly, that's the bug!

### Debugging Tool Execution

To debug file tools (read, write, edit, etc.):

1. Set breakpoints in `src/tools/file-tools.ts`
   - Line 18 - `readTool.execute`
   - Line 36 - `writeTool.execute`
   - Line 56 - `editTool.execute`

2. Start debugging
3. Ask the agent to use a tool: "read package.json"
4. Breakpoint will hit when the tool executes
5. Inspect parameters and return values

### Debugging OpenAI API Calls

To see what's being sent to OpenAI:

1. Set breakpoint at `src/agent.ts` line 44 - `const response = await this.openai.chat.completions.create(...`
2. Start debugging
3. Send a message
4. When it pauses, inspect:
   - `this.messages` - Full conversation history
   - The tools array being sent
   - The model being used

### Debugging MCP Connections

To debug MCP server connections:

1. Set breakpoints in `src/mcp/client.ts`
   - Line 16 - `connectToServer`
   - Line 40 - `listTools`
   - Line 49 - Tool execution

2. Ensure you have MCP servers configured in `~/.esnaad/config.json`
3. Start debugging
4. Watch the connection process

## Debug Console Tips

While paused at a breakpoint, use the Debug Console to:

```javascript
// Check stdin state
process.stdin.readable
process.stdin.readableEnded
process.stdin.destroyed

// Check readline state
rl.closed

// Inspect variables
this.messages
this.tools
config

// Evaluate expressions
JSON.stringify(message, null, 2)
```

## Common Debugging Scenarios

### "Why isn't my breakpoint hitting?"

1. **Check the source map**: Make sure you ran `npm run build`
2. **Verify the file**: Ensure you set the breakpoint in the `.ts` file, not `.js`
3. **Check the execution path**: Code might not be reaching that line
4. **Try rebuilding**: `npm run build` and restart debugger

### "Variables show as undefined"

- This is normal for optimized code
- Try the "Debug TypeScript Directly" config for better variable inspection
- Or use `console.log()` statements

### "Debugger won't start"

1. Check that `.env` file exists with `OPENAI_API_KEY`
2. Run `npm install` to ensure all dependencies are installed
3. Check the Debug Console for error messages
4. Try the "Debug Esnaad Code (No Build)" config

### "Terminal closes immediately"

- This might be the Windows loop bug
- Use "Debug Esnaad (Debug Version)" to see detailed logs
- Check if ora spinner was accidentally re-added

## Using Integrated Terminal

The debugger uses VS Code's integrated terminal, which means:

- ✅ You can type interactive commands
- ✅ Readline works correctly
- ✅ Colors and formatting work
- ✅ You can see stdin/stdout in real-time

If you prefer external terminal:
- Change `"console": "integratedTerminal"` to `"console": "externalTerminal"` in `.vscode/launch.json`
- But note: integrated terminal is better for Windows compatibility

## Performance Notes

- **First debug run**: Slower (needs to compile + start Node debugger)
- **Subsequent runs**: Faster if using "No Build" config
- **TypeScript direct debug**: Slower runtime but no build wait
- **Compiled JS debug**: Faster runtime, requires build step

## Recommended Extensions

VS Code will suggest these (see `.vscode/extensions.json`):

- **Error Lens** - Shows errors inline
- **TypeScript** - Better TypeScript support
- **ESLint** - Code linting (if you add it)
- **Prettier** - Code formatting (if you add it)

## Keyboard Shortcuts

- `F5` - Start debugging / Continue
- `F9` - Toggle breakpoint
- `F10` - Step over
- `F11` - Step into
- `Shift+F11` - Step out
- `Shift+F5` - Stop debugging
- `Ctrl+Shift+F5` - Restart debugging

## Advanced: Debugging Multiple Sessions

If you need to debug MCP servers AND Esnaad Code:

1. Start Esnaad Code debugger normally
2. In another VS Code window, open the MCP server project
3. Attach to the MCP server process
4. Now you can debug both simultaneously

## Troubleshooting

### Breakpoints show as "unverified" (grey circle)

- **Cause**: Source maps not loading correctly
- **Fix**: Rebuild (`npm run build`) and restart debugger

### "Cannot find module" errors

- **Cause**: Dependencies not installed or wrong Node version
- **Fix**: Run `npm install` and verify Node.js v18+

### Debugger stops at exceptions you don't care about

- **Fix**: In Debug sidebar, uncheck "Uncaught Exceptions" or "All Exceptions"

### Want to skip debugging node_modules

- Already configured! See `"skipFiles": ["<node_internals>/**"]` in launch.json

## Best Practices

1. **Always build before debugging** (unless using ts-node config)
2. **Use meaningful breakpoints** - Don't set too many at once
3. **Watch key variables** - Add them to the Watch panel
4. **Use conditional breakpoints** - Right-click breakpoint → Edit Breakpoint → Add condition
5. **Check Debug Console** - Often has helpful error messages
6. **Save your .env file** - Debugger won't work without API key

## Getting Help

If debugging isn't working:

1. Check the Debug Console for errors
2. Verify `npm run build` succeeds
3. Ensure `.env` file exists with valid API key
4. Try the "Debug TypeScript Directly" config as an alternative
5. Check that you're on the correct git branch

## Example: Full Debugging Session

```
1. Open VS Code: code .
2. Open src/cli.ts
3. Set breakpoint on line 87 (user message processing)
4. Press F5 (starts "Debug Esnaad Code" by default)
5. Wait for build to complete
6. Terminal shows: "esnaad>"
7. Type: "hi"
8. Debugger pauses at line 87
9. Inspect variables in Debug sidebar
10. Press F10 to step through code
11. Press F5 to continue
12. See response in terminal
13. Type another message to test the loop
```

Happy debugging! 🐛🔍
