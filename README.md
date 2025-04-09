# MCP3 Monorepo

This monorepo contains implementations of the Model Context Protocol for different blockchain networks.

## Packages

- `@mcp3/common`: Shared utilities and types used across implementations
- `@mcp3/eth-mcp`: Ethereum implementation of the Model Context Protocol
- `@mcp3/sui-mcp`: Sui Network implementation of the Model Context Protocol

## Development

This project uses pnpm as the package manager and workspaces for managing the monorepo.

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Clean all packages
pnpm clean
```

### Working with individual packages

```bash
# Build a specific package
pnpm --filter @mcp3/eth-mcp build

# Run a specific package
pnpm --filter @mcp3/sui-mcp start
```

## License

ISC
# mcp3
