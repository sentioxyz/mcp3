# Sui MCP (Model Context Protocol)

A TypeScript implementation of the Model Context Protocol for the Sui Network.

[![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sentioxyz/mcp3)


## Features

- MCP server for integration with AI assistants
- Connect to Sui network nodes
- Download ABI (Application Binary Interface) for Sui packages
- Call view functions with type arguments support
- Query events from the Sui blockchain
- TypeScript support
- Command-line interface

## Prerequisites

- Node.js (v16 or higher)
- pnpm (v7 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sui-mcp
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the root directory with your configuration:
```env
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

## Usage

### MCP Server

The primary use case for this project is running an MCP server for integration with AI assistants.

Start the MCP server:
```bash
npx sui-mcp serve
```

The server provides the following tools for AI assistants:
- `sui-view-function`: Call a view function for a given address (with type arguments support)
- `sui-download-abi`: Get the ABI for a given object ID
- `sui-query-events`: Query events from Sui RPC
- `sui-get-balance`: Get the balance of a specific coin type for a wallet address
- `sui-get-all-balances`: Get all coin balances for a wallet address
- `sui-get-coins`: Get detailed information about coins owned by a wallet address
- `sui-get-coin-metadata`: Get metadata for a specific coin type

### CLI Usage

The project also provides a command-line interface for interacting with the Sui network.

#### Global Options

- `-n, --nodeUrl <nodeUrl>`: Specify Sui RPC URL (defaults to value from .env or mainnet)
- `-v, --verbose`: Enable verbose output

#### Commands

##### View Function

Call a view function for a given address:
```bash
npx sui-mcp view <package_module> <fn_and_params>
```

The function name can include type arguments in the format `function<T0,T1>(arg1,arg2)`.

Example:
```bash
# Call a simple function
npx sui-mcp view 0x2::coin "total_supply(0x2::sui::SUI)"

# Call a function with type arguments
npx sui-mcp view 0x2::coin "balance<0x2::sui::SUI>(0x123)"
```

##### Get ABI

Get the ABI for a given package ID:
```bash
npx sui-mcp get-abi <object_id>
```

Options:
- `-j, --json`: Output in JSON format
- `-l, --long-address`: Display full addresses instead of shortened versions
- `-p, --public-only`: Only show public functions (default: true)
- `-r, --read-only`: Only show read-only non-void functions

Example:
```bash
# Get ABI for a package
npx sui-mcp get-abi 0x2

# Get ABI in JSON format
npx sui-mcp get-abi 0x2 --json
```

##### Query Events

Query events from Sui RPC:
```bash
npx sui-mcp query-events <filter>
```

Options:
- `-c, --cursor <cursor>`: Pagination cursor (JSON string)
- `-l, --limit <limit>`: Maximum number of events to return (default: 50)
- `-d, --descending`: Sort events in descending order
- `-j, --json`: Output in JSON format

Filter formats:
1. `txId` - e.g., "0x123..."
2. `package::module::type` - e.g., "0x2::coin::CoinEvent"

Examples:
```bash
# Get events by transaction digest
npx sui-mcp query-events 0x123abc

# Get events with a specific type
npx sui-mcp query-events 0x2::coin::CoinEvent

# Get events from a specific module
npx sui-mcp query-events 0x2::coin
```

### Development

To run the project in development mode:
```bash
npm run dev
```

### Building

To build the project:
```bash
npm run build
```

## API Documentation

### MCP Server

The MCP server is the primary way to use this project. It provides a server that can be integrated with AI assistants.

```typescript
import { startServer } from 'sui-mcp';

// Start the MCP server
await startServer({ nodeUrl: 'https://fullnode.mainnet.sui.io:443' });
```

### Core Functions

#### Call View Function

```typescript
import { callViewFunction } from 'sui-mcp';

// Call a view function
const result = await callViewFunction({
  nodeUrl: 'https://fullnode.mainnet.sui.io:443',
  packageId: '0x2',
  module: 'coin',
  functionName: 'balance',
  params: ['0x123'],
  typeArguments: ['0x2::sui::SUI']
});
```

#### Download ABI

```typescript
import { downloadABI } from 'sui-mcp';

// Download ABI for a package
const abi = await downloadABI(nodeUrl, packageId);
```

#### Query Events

```typescript
import { queryEvents, parseEventFilter } from 'sui-mcp';

// Query events
const filter = parseEventFilter('0x2::coin::CoinEvent');
const events = await queryEvents({
  nodeUrl: 'https://fullnode.mainnet.sui.io:443',
  filter,
  limit: 10,
  descending: false
});
```

#### Get Balance

```typescript
import { SuiClient } from '@mysten/sui/client';

// Get balance for a specific coin type
const client = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });
const balance = await client.getBalance({
  owner: '0x123...',
  coinType: '0x2::sui::SUI' // Optional, defaults to SUI if not specified
});

// Get all balances for a wallet
const allBalances = await client.getAllBalances({
  owner: '0x123...'
});

// Get coins owned by a wallet
const coins = await client.getCoins({
  owner: '0x123...',
  coinType: '0x2::sui::SUI', // Optional
  limit: 50 // Optional
});

// Get metadata for a specific coin type
const metadata = await client.getCoinMetadata({
  coinType: '0x2::sui::SUI'
});
```

## License

MIT# mcp3
