# Transaction Server

A standalone server for handling transactions and serving the transaction UI.

## Features

- Express server for handling transaction registration and retrieval
- Serves the transaction UI as static files
- Simple API for registering and retrieving transactions
- Robust path resolution for finding transaction-ui static files
- Command-line interface (CLI) for starting and managing the server
- Automatic port fallback: if the specified port is in use, the server will try the next port
- TypeScript support

## Installation

```bash
npm install @mcp3/transaction-server
```

## Usage

### Starting the server

#### Using the CLI

```bash
# Start the server with default configuration
transaction-server start

# Start the server with custom address and port
transaction-server start --address 0.0.0.0 --port 4000

# Show help
transaction-server --help
```

#### Programmatically

```typescript
import { startTransactionServer } from '@mcp3/transaction-server';

// Start the server with default configuration
startTransactionServer({
  enabled: true,
  address: 'localhost',
  port: 3000
}).then(serverUrl => {
  if (serverUrl) {
    console.log(`Transaction server started at ${serverUrl}`);
    // Note: If port 3000 was in use, the server might be running on a different port
  } else {
    console.error('Failed to start transaction server');
  }
});
```

### Registering a transaction

```typescript
import { TransactionServerClient } from '@mcp3/transaction-server';

// Register the transaction with the server
const client = new TransactionServerClient('http://localhost:3000');
const { txId, url } = await client.registerTransaction(transactionBytes);

// Redirect the user to the transaction signing page
window.open(url, '_blank');
```

## API Endpoints

### POST /api/sui/tx

Register a transaction with the server.

**Request Body:**
The request body should contain the transaction bytes as plain text.

**Response:**
```json
{
  "success": true,
  "message": "Transaction registered successfully",
  "txId": "transaction-id",
  "url": "http://localhost:3000/tx/txId"
}
```

### GET /api/sui/tx/:txId

Get a transaction from the server.

**Response:**
```json
{
  "txId": "transaction-id",
  "txBytes": "transaction-bytes"
}
```

## Static File Serving

The transaction server serves the static files from the @mcp3/transaction-ui package. It looks for these files in the following locations:

1. `node_modules/@mcp3/transaction-ui/dist` in the current working directory
2. Relative path `../../transaction-ui/dist` for monorepo development
3. `node_modules/@mcp3/transaction-ui/dist` relative to the server file
4. Parent directory's node_modules for npm/yarn workspaces

If none of these locations exist, the server will create a minimal static directory with a placeholder index.html file.

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Start the server using the CLI
npm run start
# or directly
./dist/cli.js start

# Start the server in development mode
npm run dev

# Clean build artifacts
npm run clean
```

## CLI Commands

```bash
# Show help
transaction-server --help

# Start the server
transaction-server start [options]

# Options for start command
#  -a, --address <address>  Address to listen on (default: "localhost")
#  -p, --port <port>        Port to listen on (default: "3000")
#                           Note: If the specified port is in use, the server will try port+1
#  --disable               Disable the server
#  -h, --help               Display help for command

# Stop the server
transaction-server stop
```

## License

MIT
