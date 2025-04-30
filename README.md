# MCP3 Monorepo

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

### Use Cli

For a list of available commands and options, run:
```
npx @mcp3/sui --help
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
