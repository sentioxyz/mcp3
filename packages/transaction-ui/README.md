# Transaction UI

A React component library for Sui transaction signing and submission.

## Features

- React components for displaying and signing Sui transactions
- Integration with @mysten/dapp-kit for wallet connections
- Direct transaction submission to the Sui blockchain
- Styled with Tailwind CSS and shadcn/ui components
- TypeScript support

## Installation

```bash
npm install @mcp3/transaction-ui
```

## Usage

### Basic Usage

```tsx
import { TransactionPage, Providers } from '@mcp3/transaction-ui';
import '@mcp3/transaction-ui/styles.css';

function App() {
  return (
    <Providers>
      <TransactionPage txId="your-transaction-id" />
    </Providers>
  );
}
```

### With React Router

```tsx
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { TransactionPage, Providers } from '@mcp3/transaction-ui';
import '@mcp3/transaction-ui/styles.css';

function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path="/sui/tx/:txId" element={<TransactionRoute />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}

function TransactionRoute() {
  const { txId } = useParams<{ txId: string }>();
  return <TransactionPage txId={txId} />;
}
```

## Components

### TransactionPage

The main component for displaying and signing transactions.

```tsx
<TransactionPage txId="your-transaction-id" />
```

### Providers

Provides the necessary context for the transaction components.

```tsx
<Providers>
  {/* Your components */}
</Providers>
```

## Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build the library
npm run build:lib
```

## License

MIT
