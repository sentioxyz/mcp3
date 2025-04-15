# Sui Navi (Model Context Protocol)

A TypeScript implementation of the Model Context Protocol for the Navi Protocol on Sui Network.

## Features

- MCP server integration for Navi Protocol
- Connect to Sui network nodes
- Query Navi Protocol data and interact with Navi contracts
- Retrieve pool information and user balances
- Get health factors and available rewards
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
pnpm --filter @mcp3/sui-navi build
```

## Usage

### As a library

```typescript
import { NaviClient } from '@mcp3/sui-navi';

// Initialize the client
const client = new NaviClient({
  networkType: 'mainnet'
});

// Get pool information
const poolInfo = await client.getPoolInfo();
console.log(poolInfo);
```

### As a CLI tool

```bash
# Get help
sui-navi --help

# Get pool information
sui-navi pool-info

# Get health factor for an address
sui-navi health-factor <address>
```

## API Reference

The package exposes the following main classes and functions:

- `NaviClient`: Main client for interacting with Navi Protocol
- `getPoolInfo()`: Get information about Navi pools
- `getHealthFactor()`: Get health factor for a specific address
- `getAvailableRewards()`: Get available rewards for an address

## License

MIT
