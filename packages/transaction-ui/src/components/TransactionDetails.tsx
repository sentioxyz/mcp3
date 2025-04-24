import React from 'react';
import { Transaction } from '@mysten/sui/transactions';

interface TransactionDetailsProps {
  transaction: Transaction | null;
  isLoading: boolean;
  error: Error | null;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transaction,
  isLoading,
  error
}) => {
  if (isLoading) {
    return <div className="p-4 bg-gray-50">Loading transaction details...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700">{error.message}</div>;
  }

  if (!transaction) {
    return <div className="p-4 bg-red-50 text-red-700">Transaction not found</div>;
  }

  const txData = transaction.getData();

  return (
    <pre className="overflow-auto max-h-96 p-4 bg-gray-50 text-sm font-mono">
      {JSON.stringify(txData, null, 2)}
    </pre>
  );
};
