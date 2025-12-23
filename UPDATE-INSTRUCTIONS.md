# Update Instructions - Fix Loop Issue

The loop exit bug has been fixed! Follow these steps to update your installation:

## For Windows (PowerShell - Run as Administrator)

```powershell
# 1. Pull the latest changes
git pull origin claude/basic-coding-agent-1xb8N

# 2. Run the rebuild script
.\rebuild.bat
```

**OR manually:**

```powershell
# 1. Pull latest
git pull origin claude/basic-coding-agent-1xb8N

# 2. Clean old build
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# 3. Install dependencies
npm install

# 4. Rebuild
npm run build

# 5. Unlink old version
npm unlink -g esnaad 2>$null

# 6. Link new version
npm link

# 7. Verify
Get-Command esnaad
```

## For macOS/Linux

```bash
# 1. Pull the latest changes
git pull origin claude/basic-coding-agent-1xb8N

# 2. Run the rebuild script
./rebuild.sh
```

**OR manually:**

```bash
# 1. Pull latest
git pull origin claude/basic-coding-agent-1xb8N

# 2. Clean, rebuild, and relink
rm -rf dist/
npm install
npm run build
npm unlink -g esnaad 2>/dev/null || true
npm link

# 3. Verify
which esnaad
```

## Verify the Fix is Working

After rebuilding and relinking, test the continuous loop:

```
$ esnaad

🚀 Esnaad Code - AI Coding Assistant

Model: gpt-4-turbo-preview
Working directory: /path/to/directory

Type your request or /help for commands
Press Ctrl+C or type /exit to quit

esnaad> hi
[Agent responds with greeting]
────────────────────────────────────────────────────────────
esnaad> tell me a joke
[Agent responds with joke]
────────────────────────────────────────────────────────────
esnaad> what's 2+2?
[Agent responds with answer]
────────────────────────────────────────────────────────────
esnaad> /exit

Goodbye! 👋
```

**The key test**: After each response, you should see the `esnaad>` prompt return, waiting for your next input. The program should NOT exit after the first response.

## What Was Fixed?

The bug was in `src/cli.ts`. The async action function was completing immediately after setting up event listeners, causing Commander.js to exit the program.

**The fix** (lines 97-105 in src/cli.ts):
```typescript
// Create a promise that resolves when readline closes
// This keeps the action function alive until user exits
await new Promise<void>((resolve) => {
  rl.on('close', async () => {
    console.log(chalk.cyan('\n\nGoodbye! 👋\n'));
    await mcpClient.close();
    resolve();
  });
});
```

This Promise keeps the action function alive until you explicitly exit with `/exit`, `/quit`, or Ctrl+D.

## Troubleshooting

### Issue: `esnaad` command not found after relinking

**Solution:**
```powershell
# Windows
npm link
Get-Command esnaad

# macOS/Linux
sudo npm link
which esnaad
```

### Issue: Still exits after first message

**Solution:**
1. Make sure you pulled the latest code
2. Verify the fix is in your source file:
   ```bash
   grep -A 5 "Create a promise that resolves" src/cli.ts
   ```
   You should see the Promise code.
3. Make sure you rebuilt: `npm run build`
4. Make sure you relinked: `npm link`
5. Close ALL terminal windows and open a new one

### Issue: Multiple versions of esnaad installed

**Solution:**
```powershell
# Windows
npm unlink -g esnaad
npm link

# macOS/Linux
sudo npm unlink -g esnaad
sudo npm link
```

## Confirm Success

Run this simple test:
```bash
echo "hi" | esnaad
```

If the program hangs waiting for more input (instead of exiting), the fix is working! Press Ctrl+C to exit.

## Need Help?

If the issue persists:
1. Check that `dist/cli.js` has been rebuilt (check file timestamp)
2. Verify the `esnaad` command points to the right location: `which esnaad` or `Get-Command esnaad`
3. Try running directly: `node dist/cli.js`
