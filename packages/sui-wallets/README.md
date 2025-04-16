# Sui Wallets (Model Context Protocol)

A TypeScript implementation for managing multiple Sui wallets within the Model Context Protocol.

## Features

- Manage multiple wallet addresses via CLI parameters
- Assign friendly names to wallets for easier identification
- Search for wallets by partial name or address match
- Get wallets using partial matching when exact match not found
- Load private keys or mnemonics from environment variables or config files
- Wallet tools for checking balances and signing transactions
- Resource representation of wallets for easy access
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
pnpm --filter @mcp3/sui-wallets build
```

## Usage

### As a library

```typescript
import { WalletManager } from '@mcp3/sui-wallets';

// Initialize the wallet manager
const walletManager = new WalletManager({
  nodeUrl: 'https://fullnode.mainnet.sui.io:443'
});

// Generate a new wallet
const { walletInfo, mnemonic } = walletManager.generateWallet('Generated Wallet');
console.log(`Generated wallet with address ${walletInfo.address} and mnemonic: ${mnemonic}`);

// Add wallets with optional names
walletManager.addWallet('0x123...', 'Main Wallet', { mnemonic: 'your-mnemonic-phrase' });
walletManager.addWallet('0xabc...', 'Secondary Wallet', { mnemonic: 'your-mnemonic-phrase' });

// Export a wallet's mnemonic
const exportedMnemonic = walletManager.exportMnemonic('Main Wallet');
console.log(`Exported mnemonic: ${exportedMnemonic}`);

// Get wallet by exact match
let wallet = walletManager.getWallet('Main Wallet');

// Get wallet with partial matching
wallet = walletManager.getWallet('Ma', { allowPartialMatch: true, caseSensitive: false });

// Get wallet balance (can use address or name)
const balance = await walletManager.getBalance('Main Wallet');
console.log(balance);

// Search for wallets by partial name or address
const searchResults = walletManager.searchWallets('Main', {
  matchName: true,
  matchAddress: true,
  caseSensitive: false,
  limit: 5
});
console.log(searchResults);

// Sign a transaction (can use address or name)
const signedTx = await walletManager.signTransaction('Main Wallet', txBytes);
```

### As a CLI tool

```bash
# Get help
sui-wallets --help

# List all configured wallets
sui-wallets list

# Generate a new wallet with a random keypair and mnemonic
sui-wallets-generate --name "My New Wallet"

# Add a new wallet with a name
sui-wallets-add --address 0x123... --name "Main Wallet" --mnemonic "your mnemonic phrase"

# Export a wallet's mnemonic
sui-wallets-export-mnemonic --identifier "My New Wallet"

# Export a wallet's private key
sui-wallets-export-private-key --identifier "My New Wallet"

# Get balance for a specific wallet (can use address or name)
sui-wallets balance --address "Main Wallet"

# Get a specific wallet with partial matching
sui-wallets-get --identifier "Ma" --allowPartialMatch true

# Search for wallets by partial name or address
sui-wallets-search --query "Main" --matchName true --matchAddress true

# Get balance for all wallets
sui-wallets balance --all
```

## Configuration

By default, wallet configuration is stored in `$HOME/.sui-wallet/config.json`. You can configure wallets using:

1. Environment variables:
   - `SUI_WALLET_ADDRESSES`: Comma-separated list of wallet addresses
   - `SUI_WALLET_NAMES`: Comma-separated list of wallet names (in same order as addresses)
   - `SUI_DEFAULT_WALLET`: Default wallet (can be address or name)
   - `SUI_PRIVATE_KEYS`: Comma-separated list of private keys (in same order as addresses)
   - `SUI_MNEMONICS`: Comma-separated list of mnemonics (in same order as addresses)

2. Config file:
   - Create a JSON file with wallet configurations
   - Set the path using `SUI_WALLET_CONFIG_PATH` environment variable

Example config file:
```json
{
  "wallets": [
    {
      "address": "0x123...",
      "name": "Main Wallet",
      "privateKey": "your-private-key"
    },
    {
      "address": "0xabc...",
      "name": "Secondary Wallet",
      "mnemonic": "your-mnemonic-phrase"
    }
  ],
  "defaultWallet": "Main Wallet"
}
```

## License

MIT
