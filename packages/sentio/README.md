# @mcp3/sentio

A Sentio API integration package for MCP3, providing tools to interact with Sentio analytics API.

## Installation

```bash
pnpm install @mcp3/sentio
```

## Features

- Query TVL (Total Value Locked) data from Sentio API

## Usage

### As a library

```typescript
import { register } from '@mcp3/sentio';
import { Registration } from '@mcp3/common';

const registration = new Registration();
register(registration);

// Use registration with your application
```

### CLI

```bash
# Query TVL data for a protocol
sentio-cli sentio-tvl-data --protocol <protocol-name>

# Query TVL data with additional parameters
sentio-cli sentio-tvl-data --protocol <protocol-name> --chain <chain-name> --from-timestamp <timestamp> --to-timestamp <timestamp> --time-interval 1d
```

## License

MIT