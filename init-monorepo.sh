#!/bin/bash

# Initialize the monorepo
echo "Initializing MCP3 monorepo..."

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build packages in the correct order
echo "Building packages..."
pnpm --filter @mcp3/common build
pnpm --filter @mcp3/eth-mcp build
pnpm --filter @mcp3/sui-mcp build

echo "Monorepo initialization complete!"
