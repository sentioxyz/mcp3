# Sui Base (Model Context Protocol)

Base utilities and tools for Sui Network in MCP3. This package provides common functionality used by other Sui-related packages.

## Features

- Core Sui network interaction utilities
- Common tools for interacting with the Sui blockchain
- Resource registration for Sui resources
- CLI utilities for Sui-based applications

## Usage

This package is primarily used as a dependency for other Sui-related packages in the MCP3 ecosystem.

### As a dependency

```typescript
import { 
  downloadABI, 
  callViewFunction, 
  queryEvents, 
  registerSUIBaseTools 
} from '@mcp3/sui-base';

// Use the utilities
const abi = await downloadABI(nodeUrl, packageId);
```

### Core Functions

#### Download ABI

```typescript
import { downloadABI } from '@mcp3/sui-base';

// Download ABI for a package
const abi = await downloadABI(nodeUrl, packageId);
```

#### Call View Function

```typescript
import { callViewFunction } from '@mcp3/sui-base';

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

#### Query Events

```typescript
import { queryEvents, parseEventFilter } from '@mcp3/sui-base';

// Query events
const filter = parseEventFilter('0x2::coin::CoinEvent');
const events = await queryEvents({
  nodeUrl: 'https://fullnode.mainnet.sui.io:443',
  filter,
  limit: 10,
  descending: false
});
```

## License

MIT
