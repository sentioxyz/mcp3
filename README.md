# MCP3 Monorepo

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sentioxyz/mcp3)


This monorepo contains implementations of the Model Context Protocol for different blockchain networks, providing tools and services for blockchain data access and interaction.

## How to use MCP3 for SUI

MCP3 provides a comprehensive suite of tools for interacting with the Sui blockchain. The main package `@mcp3/sui` offers a CLI and API for common operations, while specialized packages provide additional functionality for specific protocols and use cases.

### Claude Desktop Quick Start

Add following to your claude desktop config
```
{
  ...
  "mcpServers": {
    ...
    "mcp3-sui": {
      "command": "npx",
      "args": [
        "-y",
        "@mcp3/sui",
        "start",
        "-t"
      ]
    }
    ...
  }
}
```

### Use CLI

For a list of available commands and options, run:
```
npx @mcp3/sui --help
```

#### Using the Tool Command

MCP3 provides a unified `tool` command that organizes all tools from sub-projects as subcommands. To see all available tools, run:

```
npx @mcp3/sui tool
```

This will display a list of all available tools grouped by their prefix (e.g., sui-cetus, sui-wallets, etc.).

To run a specific tool, use:

```
npx @mcp3/sui tool <tool-name> [options]
```

For example:

```
npx @mcp3/sui tool sui-wallets-list
npx @mcp3/sui tool sui-cetus-pool-list
```

## Packages

### Core Packages
- `@mcp3/common`: Shared utilities, types, and tools used across all implementations
- `@mcp3/eth`: Ethereum implementation of the Model Context Protocol
- `@mcp3/sui`: Sui Network implementation of the Model Context Protocol

### Sui Ecosystem Packages
- `@mcp3/sui-base`: Base utilities and tools for Sui Network
- `@mcp3/sui-wallets`: Wallet management tools for Sui Network
- `@mcp3/sui-cetus`: Cetus Protocol integration for Sui Network
- `@mcp3/sui-navi`: Navi Protocol integration for Sui Network

### Data Integration Packages
- `@mcp3/dex-screener`: DexScreener API integration for MCP3
- `@mcp3/defilama`: DeFiLlama API integration for MCP3

### Transaction Management
- `@mcp3/transaction-server`: Server for handling transactions and serving the transaction UI
- `@mcp3/transaction-ui`: React component library for transaction signing and submission

## Development

This project uses pnpm as the package manager and workspaces for managing the monorepo.

### CLI Structure

MCP3 uses a unified CLI structure where:

1. All tools from sub-projects are registered as subcommands of a main `tool` command
2. When no specific tool is named, the CLI automatically lists all available tools
3. Tools are grouped by their prefix for better organization
4. Tools are only accessible through the `tool` command

When implementing new tools:

1. Register your tool using `registration.addTool()` in your package
2. Create a callback function that registers all tools in your package
3. Pass this callback to the `startCli` function as the second parameter

Example:

```typescript
// Create a callback function to register tools
const registerTools = async (reg: Registration) => {
    // Register your tools
    registerYourTools(reg);
};

// Register tools immediately for the main CLI
registerTools(registration);

// Pass the callback to startCli
startCli(registration, registerTools);
```

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Clean all packages
pnpm clean

# Run tests
pnpm test
```

### Working with Individual Packages

```bash
# Build a specific package
pnpm --filter @mcp3/eth build

# Run a specific package
pnpm --filter @mcp3/sui start

# Run tests for a specific package
pnpm --filter @mcp3/sui-navi test
```

## Package Dependencies

The packages in this monorepo have the following dependency relationships:

- Most packages depend on `@mcp3/common` for shared utilities
- Sui-related packages depend on `@mcp3/sui-base` for core Sui functionality
- `@mcp3/sui` has peer dependencies on various Sui ecosystem packages
- `@mcp3/transaction-server` depends on `@mcp3/transaction-ui` for serving the UI

## Versioning

Packages in this monorepo are versioned independently. When making changes:

1. Changes to a package will trigger version bumps for that package and its dependents
2. Remember to include `sui-navi` package when bumping versions
3. When creating bundle packages, exclude transaction-server and transaction-ui projects from the bundle but add them as dependencies

## Testing

Each package has its own test suite. For the `sui-navi` project, tests follow the same patterns as in `sui-wallets`, using the node:tests framework with tsx for dev dependencies.

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @mcp3/sui-navi test
```


## Contributing

Contributions to MCP3 are welcome! Here are some guidelines:

1. Fork the repository and create a feature branch
2. Make your changes, following the code style of the project
3. Add or update tests as necessary
4. Update documentation to reflect your changes
5. Submit a pull request with a clear description of the changes

## License

ISC
