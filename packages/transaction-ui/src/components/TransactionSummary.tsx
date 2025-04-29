
import React, { useMemo } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { type TransactionSummary as TxSummary, extractTransactionSummary } from '@/utils/transactionSummaryExtractor';

interface TransactionSummaryProps {
  transaction: Transaction | null;
  isLoading: boolean;
  error: Error | null;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
                                                                        transaction,
                                                                        isLoading,
                                                                        error
                                                                      }) => {
  // Initialize transaction summary with useMemo
  const transactionSummary = useMemo(() => {
    if (!transaction) {
      // Return a default empty summary if no transaction
      return {
        txId: null,
        gasData: { budget: '0', price: '0' },
        moveCalls: [],
        coinOperations: []
      } as TxSummary;
    }
    return extractTransactionSummary(transaction, null);
  }, [transaction]);

  if (isLoading) {
    return <div className="p-4 bg-gray-50">Loading transaction summary...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700">{error.message}</div>;
  }

  if (!transaction) {
    return <div className="p-4 bg-red-50 text-red-700">Transaction summary not available</div>;
  }

  // Calculate estimated gas cost
  const gasCost = Number(transactionSummary.gasData.budget) * Number(transactionSummary.gasData.price) / 1_000_000_000;
  const formattedGasCost = gasCost.toFixed(6);

  return (
      <div className="space-y-4">
        <div className="pb-2">
          <strong className="font-medium">Transaction ID:</strong>
          <span className="ml-2 font-mono text-sm break-all">{transactionSummary.txId}</span>
        </div>

        {transactionSummary.estimatedCoinSpent && (
            <div className="pb-2">
              <strong className="font-medium">Estimated Cost:</strong>
              <span className="ml-2 font-mono text-red-600">{transactionSummary.estimatedCoinSpent.amountInSui} SUI</span>
              <span className="ml-2 text-gray-500 text-xs">
            ({transactionSummary.estimatedCoinSpent.amount} base units)
          </span>
            </div>
        )}

        <div className="pb-2">
          <strong className="font-medium">Gas:</strong>
          <span className="ml-2 font-mono">{formattedGasCost} SUI</span>
          <span className="ml-2 text-gray-500 text-xs">
          (Budget: {transactionSummary.gasData.budget}, Price: {transactionSummary.gasData.price})
        </span>
        </div>

        {transactionSummary.moveCalls.length > 0 && (
            <div className="pb-2">
              <strong className="font-medium block mb-1">Move Calls:</strong>
              <ul className="list-disc pl-5 space-y-1">
                {transactionSummary.moveCalls.map((call, index) => {
                  // Determine if this is a common function and add a friendly description
                  let friendlyDescription = '';
                  if (call.module === 'coin' && call.function === 'transfer') {
                    friendlyDescription = 'Transfer coins';
                  } else if (call.module === 'pay' && call.function === 'pay') {
                    friendlyDescription = 'Pay coins';
                  } else if (call.module === 'coin' && call.function === 'split_and_transfer') {
                    friendlyDescription = 'Split and transfer coins';
                  }

                  return (
                    <li key={index} className="text-sm">
                      <span className="font-mono text-blue-700">
                        {call.package.substring(0, 8)}...{call.package.substring(call.package.length - 4)}::
                        {call.module}::{call.function}
                      </span>
                      {friendlyDescription && (
                        <span className="ml-2 text-gray-600 font-normal">
                          ({friendlyDescription})
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
        )}

        {transactionSummary.coinOperations.length > 0 && (
            <div className="pb-2">
              <strong className="font-medium block mb-1">Coin Operations:</strong>
              <ul className="list-disc pl-5 space-y-1">
                {transactionSummary.coinOperations.map((op, index) => (
                    <li key={index} className="text-sm">
                      <span className={op.type === 'send' ? 'text-red-600' : 'text-green-600'}>
                        {op.type === 'send' ? 'Send' : 'Receive'}{' '}
                        {op.amountInSui ? `${op.amountInSui} SUI` : op.amount !== 'unknown' ? op.amount : 'unknown amount'}{' '}
                        {op.coinType !== 'unknown' ? `(${op.coinType})` : ''}
                        {op.recipient && (
                          <span className="ml-1 text-gray-600">
                            to{' '}
                            <span className="font-mono">
                              {op.recipient.substring(0, 6)}...{op.recipient.substring(op.recipient.length - 4)}
                            </span>
                          </span>
                        )}
                      </span>
                    </li>
                ))}
              </ul>
            </div>
        )}
      </div>
  );
};