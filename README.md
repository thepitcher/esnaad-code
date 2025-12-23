# Esnaad Code

A powerful AI coding assistant with file manipulation, MCP support, and OpenAI integration. Similar to Claude Code but uses OpenAI's API.

**🪟 Target Platform**: Windows (with cross-platform support)

## Features

- **File Operations**: Read, write, and edit files with ease
- **Code Search**: Find files and search code using glob patterns and grep
- **Shell Execution**: Run commands directly from the agent (CMD/PowerShell on Windows, bash on Unix)
- **MCP Support**: Connect to Model Context Protocol servers for extended functionality
- **Interactive CLI**: Command-line interface for seamless interaction
- **OpenAI Integration**: Powered by GPT-4 and other OpenAI models
- **Windows-Optimized**: Designed to work seamlessly on Windows

## Prerequisites

### Required
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** (included with Node.js)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/))

### Optional (Recommended for full functionality)
- **ripgrep** - For powerful code search (grep tool)
  - **Windows**: `choco install ripgrep` or `scoop install ripgrep`
  - **macOS**: `brew install ripgrep`
  - **Linux**: `sudo apt-get install ripgrep` or `sudo dnf install ripgrep`

## Installation

### Windows (PowerShell)

```powershell
# Clone the repository
git clone <repository-url>
cd esnaad-code

# Install dependencies
npm install

# Build the project
npm run build

# Optional: Link globally to use 'esnaad' command anywhere
npm link
```

### macOS/Linux (Bash)

```bash
# Clone the repository
git clone <repository-url>
cd esnaad-code

# Install dependencies
npm install

# Build the project
npm run build

# Optional: Link globally to use 'esnaad' command anywhere
npm link
```

## Configuration

### 1. Set up OpenAI API Key

**Windows (PowerShell):**
```powershell
# Copy the example file
copy .env.example .env

# Edit .env in notepad
notepad .env
```

**macOS/Linux (Bash):**
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### 2. Configure MCP Servers (Optional)

Create a config file:
- **Windows**: `C:\Users\YourUsername\.esnaad\config.json`
- **macOS/Linux**: `~/.esnaad/config.json`

**Example (Windows):**
```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\YourUsername\\Projects"]
    },
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  ]
}
```

**Example (macOS/Linux):**
```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/projects"]
    }
  ]
}
```

## Usage

### Start Esnaad Code

```bash
# If linked globally
esnaad

# Or run directly
npm start

# Or from build
node dist/cli.js
```

### Interactive Loop

Esnaad Code runs in a **continuous interactive loop**. You can ask multiple questions and perform multiple tasks in a single session:

```
🚀 Esnaad Code - AI Coding Assistant

Model: gpt-4-turbo-preview
Working directory: /home/user/my-project

Type your request or /help for commands
Press Ctrl+C or type /exit to quit

esnaad> read package.json and tell me what dependencies we have
[Agent reads file and responds...]
────────────────────────────────────────────────────────────

esnaad> create a new file called hello.ts with a simple function
🔧 Executing: write
[Agent creates file...]
────────────────────────────────────────────────────────────

esnaad> now read that file back to me
🔧 Executing: read
[Agent reads file...]
────────────────────────────────────────────────────────────

esnaad> find all .ts files
🔧 Executing: glob
[Agent finds files...]
────────────────────────────────────────────────────────────

esnaad> /exit
Goodbye! 👋
```

The loop continues until you:
- Type `/exit` or `/quit`
- Press Ctrl+D
- Close the terminal

### CLI Commands

- `/help` - Show available commands
- `/clear` - Clear conversation history
- `/history` - Show conversation history
- `/exit` or `/quit` - Exit Esnaad Code

### Command Line Options

```bash
esnaad --help                          # Show help
esnaad --model gpt-4                   # Use specific model
esnaad --directory /path/to/project    # Set working directory
```

## Available Tools

### File Operations

- **read**: Read file contents with line numbers
- **write**: Create or overwrite files
- **edit**: Replace text in files (supports replace all)
- **glob**: Find files matching glob patterns (e.g., `**/*.ts`)
- **grep**: Search for patterns in files using ripgrep

### Shell Execution

- **bash**: Execute shell commands with timeout support

### MCP Tools

When MCP servers are configured, their tools become available with the prefix `mcp_<servername>_<toolname>`.

## Examples

### Example 1: Create a New File

```
esnaad> create a new TypeScript file called hello.ts with a function that prints hello world
```

The agent will:
1. Use the `write` tool to create the file
2. Add appropriate TypeScript code
3. Confirm the creation

### Example 2: Search and Modify Code

```
esnaad> find all files with console.log and replace them with proper logging
```

The agent will:
1. Use `grep` to find files with console.log
2. Use `read` to examine each file
3. Use `edit` to replace with proper logging
4. Confirm changes

### Example 3: Run Tests

```
esnaad> run the test suite and fix any failing tests
```

The agent will:
1. Use `bash` to run tests
2. Analyze failures
3. Use `read` and `edit` to fix issues
4. Re-run tests to confirm

## Architecture

```
esnaad-code/
├── src/
│   ├── agent.ts          # Core agent with OpenAI integration
│   ├── cli.ts            # Command-line interface
│   ├── config.ts         # Configuration management
│   ├── types.ts          # TypeScript type definitions
│   ├── index.ts          # Main exports
│   ├── tools/
│   │   ├── file-tools.ts # File operations (read, write, edit, glob, grep)
│   │   ├── bash-tool.ts  # Shell execution
│   │   └── index.ts      # Tool registry
│   └── mcp/
│       └── client.ts     # MCP client implementation
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key (required) | - |
| `OPENAI_API_BASE` | OpenAI API base URL | `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Model to use | `gpt-4-turbo-preview` |
| `OPENAI_ORG_ID` | OpenAI organization ID | - |

## Supported OpenAI Models

- `gpt-4-turbo-preview`
- `gpt-4`
- `gpt-3.5-turbo`
- Any other OpenAI chat model

## MCP Server Examples

### Filesystem Server

```json
{
  "name": "filesystem",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"]
}
```

### GitHub Server

```json
{
  "name": "github",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": "ghp_your_token"
  }
}
```

### SQLite Server

```json
{
  "name": "sqlite",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"]
}
```

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"

Make sure you have a `.env` file with your OpenAI API key:

**Windows (PowerShell):**
```powershell
echo "OPENAI_API_KEY=sk-your-key" > .env
```

**macOS/Linux (Bash):**
```bash
echo "OPENAI_API_KEY=sk-your-key" > .env
```

### MCP servers not connecting

1. Check that the MCP server command is correct
2. Verify the server is installed (`npx` will auto-install)
3. Check the config file path:
   - **Windows**: `C:\Users\YourUsername\.esnaad\config.json`
   - **macOS/Linux**: `~/.esnaad/config.json`
4. Look for error messages in the console
5. On Windows, ensure Node.js is in your PATH

### "Command not found: rg" or ripgrep errors

The `grep` tool requires ripgrep. Install it:

**Windows:**
```powershell
# Using Chocolatey
choco install ripgrep

# Using Scoop
scoop install ripgrep

# Or download from: https://github.com/BurntSushi/ripgrep/releases
```

**macOS:**
```bash
brew install ripgrep
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install ripgrep

# Fedora
sudo dnf install ripgrep
```

### Windows-Specific Issues

**PowerShell execution policy:**
If you get script execution errors, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Long path support:**
Enable long paths in Windows if you encounter path length errors:
```powershell
# Run as Administrator
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

**Node.js not found:**
Make sure Node.js is in your PATH. Restart your terminal after installing Node.js.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

## Acknowledgments

- Inspired by Claude Code from Anthropic
- Built with OpenAI's GPT models
- Uses the Model Context Protocol (MCP) from Anthropic
