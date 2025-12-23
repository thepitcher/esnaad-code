# Esnaad Code - Windows Quick Start Guide

This guide provides Windows-specific instructions for installing and using Esnaad Code.

## Prerequisites

### 1. Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Recommended: LTS version (v18 or higher)
- Make sure to check "Add to PATH" during installation

### 2. Install ripgrep (Optional but Recommended)
Ripgrep is needed for the `grep` tool to work.

**Option A: Using Chocolatey**
```powershell
choco install ripgrep
```

**Option B: Using Scoop**
```powershell
scoop install ripgrep
```

**Option C: Manual Download**
1. Go to https://github.com/BurntSushi/ripgrep/releases
2. Download the Windows binary
3. Extract and add to your PATH

### 3. Get OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key

## Installation

Open PowerShell and run:

```powershell
# Clone the repository
git clone <repository-url>
cd esnaad-code

# Install dependencies
npm install

# Build the project
npm run build

# Optional: Link globally (run as Administrator)
npm link
```

## Configuration

### Set up OpenAI API Key

1. Copy the example file:
```powershell
copy .env.example .env
```

2. Edit the `.env` file in Notepad:
```powershell
notepad .env
```

3. Add your API key:
```
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### Configure MCP Servers (Optional)

1. Create the config directory:
```powershell
mkdir $env:USERPROFILE\.esnaad
```

2. Create the config file:
```powershell
notepad $env:USERPROFILE\.esnaad\config.json
```

3. Add your MCP servers:
```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\YourUsername\\Projects"]
    }
  ]
}
```

**Note:** Use double backslashes (`\\`) in Windows paths within JSON.

## Running Esnaad Code

```powershell
# If you ran npm link
esnaad

# Or run directly from the project
npm start

# Or from the build directory
node dist/cli.js
```

## Usage

Once Esnaad Code is running, you can interact with it:

```
esnaad> help me read the package.json file
esnaad> create a new file called test.txt with "Hello World"
esnaad> find all .ts files in this project
esnaad> run npm install
esnaad> /exit
```

## Common Windows Issues

### PowerShell Execution Policy Error

If you see execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Long Path Errors

Enable long path support (requires Administrator):
```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Then restart your computer.

### Node.js or npm Not Found

1. Make sure Node.js is installed
2. Restart PowerShell/Terminal
3. Verify installation:
```powershell
node --version
npm --version
```

### Ripgrep Not Found

The `grep` tool won't work without ripgrep. When you try to use it, you'll see:
```
Error: ripgrep (rg) not found. Please install it:
  • Using Chocolatey: choco install ripgrep
  • Using Scoop: scoop install ripgrep
  • Or download from: https://github.com/BurntSushi/ripgrep/releases
```

Install ripgrep using one of the methods above.

## File Paths in Windows

When working with Esnaad Code on Windows:

- **Forward slashes work**: `C:/Users/Name/file.txt`
- **Backslashes need escaping in JSON**: `C:\\Users\\Name\\file.txt`
- **Use relative paths when possible**: `./src/file.ts`

## Recommended Tools for Windows

- **Windows Terminal**: Better than default PowerShell
- **Chocolatey**: Package manager for Windows (`choco`)
- **Scoop**: Alternative package manager (`scoop`)
- **VS Code**: Great editor with integrated terminal

## Tips

1. **Use PowerShell or Windows Terminal** instead of CMD for better experience
2. **Run as Administrator** when installing global packages (`npm link`)
3. **Check PATH** if commands aren't found after installation
4. **Restart terminal** after installing new tools
5. **Use tab completion** in PowerShell for faster navigation

## Next Steps

Once set up, you can:
- Read and modify files
- Search your codebase
- Execute commands (npm, git, etc.)
- Connect to MCP servers for extended functionality
- Have multi-turn conversations with context preservation

For more information, see the main [README.md](README.md)

## Getting Help

- Check the [Troubleshooting](README.md#troubleshooting) section
- Review available commands with `/help`
- Check conversation history with `/history`
- Clear context with `/clear`

Happy coding! 🚀
