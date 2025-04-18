# Sui Cetus (Model Context Protocol)

A TypeScript implementation of the Model Context Protocol for the Cetus Protocol on Sui Network.

## Features

- MCP server integration for Cetus Protocol
- Connect to Sui network nodes
- Query Cetus Protocol data and interact with Cetus contracts
- Retrieve pool information and user positions
- Perform swaps and manage liquidity
- Get rewards and fees
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
pnpm --filter @mcp3/sui-cetus build
```

## Usage

### As a module

This package is primarily designed to be used as a CLI tool or as part of the MCP3 system. It provides tools for interacting with the Cetus Protocol on the Sui Network.

### As a CLI tool

```bash
# Get help
sui-cetus --help

# Get pool information
sui-cetus pool-info

# Get positions for an address
sui-cetus positions <address>
```

## CLI Commands

The package provides the following CLI commands:

- `sui-cetus-pool-info`: Get information about Cetus Protocol pools
- `sui-cetus-positions`: Get positions for a specific address
- `sui-cetus-swap-quote`: Get a quote for swapping tokens
- `sui-cetus-liquidity-calc`: Calculate liquidity and coin amounts
- `sui-cetus-add-liquidity`: Add liquidity to a Cetus Protocol pool
- `sui-cetus-fees`: Calculate fees for a position
- `sui-cetus-rewards`: Calculate rewards for a position
- `sui-cetus-apr`: Calculate APR for a pool or position
- `sui-cetus-deposit`: Deposit tokens into a Cetus Protocol liquidity pool
- `sui-cetus-withdraw`: Withdraw tokens from a Cetus Protocol liquidity position

## License

MIT
