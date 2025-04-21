# DexScreener API Integration (Model Context Protocol)

A TypeScript implementation of the Model Context Protocol for the DexScreener API.

## Features

- MCP server integration for DexScreener API
- Query token profiles and boosts
- Search for pairs matching specific criteria
- Get pairs by chain and pair address
- Get pools of a given token address
- Get pairs by token address
- TypeScript support
- Command-line interface

## Prerequisites

- Node.js (v16 or higher)
- pnpm (v7 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp3
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the package:
```bash
pnpm --filter @mcp3/dex-screener build
```

## Usage

### As a library

```typescript
import { DexScreenerClient } from '@mcp3/dex-screener';

// Initialize the client
const client = new DexScreenerClient();

// Get pairs by token address
const pairs = await client.getPairsByTokenAddress('ethereum', '0x1234...');
console.log(pairs);
```

### Command Line

```bash
# Get token profiles
pnpm --filter @mcp3/dex-screener start dexscreener-get-token-profiles

# Search for pairs
pnpm --filter @mcp3/dex-screener start dexscreener-search-pairs --q "ETH/USDT"

# Get pairs by token address
pnpm --filter @mcp3/dex-screener start dexscreener-get-pairs-by-token --chain ethereum --token 0x1234...
```

## API Reference

This package integrates with the DexScreener API. For more information, see the [DexScreener API documentation](https://docs.dexscreener.com/api/reference).

## License

MIT
