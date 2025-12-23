# Esnaad Code

A powerful AI coding assistant with file manipulation, MCP support, and OpenAI integration. Similar to Claude Code but uses OpenAI's API.

## Features

- **File Operations**: Read, write, and edit files with ease
- **Code Search**: Find files and search code using glob patterns and grep
- **Shell Execution**: Run bash commands directly from the agent
- **MCP Support**: Connect to Model Context Protocol servers for extended functionality
- **Interactive CLI**: Command-line interface for seamless interaction
- **OpenAI Integration**: Powered by GPT-4 and other OpenAI models

## Installation

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

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### 2. Configure MCP Servers (Optional)

Create a config file at `~/.esnaad/config.json`:

```json
{
  "mcpServers": [
    {
      "name": "filesystem",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
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

### Basic Commands

Once in the interactive shell:

```
esnaad> help me create a new React component

esnaad> read the package.json file and tell me about dependencies

esnaad> find all TypeScript files in the src directory

esnaad> search for "TODO" comments in the codebase
```

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

```bash
echo "OPENAI_API_KEY=sk-your-key" > .env
```

### MCP servers not connecting

1. Check that the MCP server command is correct
2. Verify the server is installed (`npx` will auto-install)
3. Check the config file path: `~/.esnaad/config.json`
4. Look for error messages in the console

### "Command not found: rg"

The `grep` tool requires ripgrep. Install it:

```bash
# macOS
brew install ripgrep

# Ubuntu/Debian
sudo apt-get install ripgrep

# Fedora
sudo dnf install ripgrep
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

## Acknowledgments

- Inspired by Claude Code from Anthropic
- Built with OpenAI's GPT models
- Uses the Model Context Protocol (MCP) from Anthropic
