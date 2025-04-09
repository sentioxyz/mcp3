# eth-contract-mcp

A command-line tool for managing and interacting with smart contracts across multiple blockchain networks (Ethereum, Aptos, Sui, etc.) using the Model Context Protocol (MCP).

## Features

- Download and manage contract ABIs
- Download contract source code
- Invoke contract view functions
- Support for multiple chains (Ethereum, Aptos, Sui, Starknet)
- MCP server integration for advanced contract interactions

## Installation

```bash
npm install -g contract-mcp
```

## Usage

### Add a Contract

Download a contract's ABI and source code:

```bash
sentio add [--chain <chain-id>] [--name <name>] <contract-address>
```

Options:
- `--chain, -c`: Chain ID (default: "1" - Ethereum mainnet)
- `--name, -n`: Custom name for the contract
- `--folder, -f`: Target folder (default: "contracts")

### Invoke Contract Functions

Call view functions on a contract:

```bash
sentio invoke [--chain <chain-id>] [--provider <rpc-url>] <contract-address> <function-name> [args...]
```

Options:
- `--chain, -c`: Chain ID (default: "1")
- `--provider, -p`: Custom RPC endpoint
- `--block, -b`: Block height for the call (default: latest)
- `--skip-download, -k`: Skip downloading ABI if not found

### Start MCP Server

Start a Model Context Protocol server:

```bash
sentio start [--scope <path>]
```

Options:
- `--scope`: Limit MCP to a specific subproject

## Supported Chains

- Ethereum Mainnet (1)
- Aptos Mainnet/Testnet
- Sui Mainnet/Testnet
- Starknet Mainnet/Sepolia
- Other EVM-compatible chains

## Environment Variables

- `ETHERSCAN_API_KEY_<CHAIN>`: API key for Etherscan-compatible APIs
- Additional configuration can be set via `.env` file

## Project Structure

```
├── src/
│   ├── cli/           # CLI command implementations
│   ├── abi.ts         # ABI management utilities
│   ├── config.ts      # Configuration handling
│   ├── contract.ts    # Contract interaction logic
│   └── serve.ts       # MCP server implementation
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run CLI
./bin/cli.js
```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
