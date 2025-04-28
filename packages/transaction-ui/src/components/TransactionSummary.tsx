
import React, {useMemo} from 'react';
import { Transaction } from '@mysten/sui/transactions';

// Interface for transaction summary
export interface TransactionSummary {
  txId: string | null;
  gasData: {
    budget: string;
    price: string;
  };
  moveCalls: Array<{
    package: string;
    module: string;
    function: string;
  }>;
  coinOperations: Array<{
    type: 'send' | 'receive';
    amount: string;
    coinType: string;
  }>;
  estimatedCoinSpent?: {
    amount: string;
    amountInSui: string;
    coinType: string;
  };
}

interface TransactionSummaryProps {
  transaction: Transaction | null;
  isLoading: boolean;
  error: Error | null;
}

export const extractTransactionSummary = (tx: Transaction, id: string | null): TransactionSummary => {
  const txData = tx.getData();
  const summary: TransactionSummary = {
    txId: id,
    gasData: {
      budget: String(txData.gasData?.budget || '0'),
      price: String(txData.gasData?.price || '0'),
    },
    moveCalls: [],
    coinOperations: []
  };

  // Extract commands from transaction
  const commands = txData.commands || [];
  commands.forEach((cmd: any) => {
    if (cmd.$kind === 'MoveCall') {
      summary.moveCalls.push({
        package: cmd.MoveCall?.package || 'unknown',
        module: cmd.MoveCall?.module || 'unknown',
        function: cmd.MoveCall?.function || 'unknown',
      });
    } else if (cmd.$kind === 'TransferObjects') {
      summary.coinOperations.push({
        type: 'send',
        amount: 'unknown', // Would need object resolution to determine
        coinType: 'unknown' // Would need object resolution to determine
      });
    } else if (cmd.$kind === 'SplitCoins') {
      // Try to extract the amount from SplitCoins operation
      try {
        // Check if this is a GasCoin split
        if (cmd.SplitCoins?.coin?.$kind === 'GasCoin' &&
            cmd.SplitCoins?.amounts?.length > 0 &&
            cmd.SplitCoins?.amounts[0]?.$kind === 'Input') {

          // Get the input index
          const inputIndex = cmd.SplitCoins.amounts[0].Input;

          // Try to get the corresponding input value
          if (txData.inputs && txData.inputs[inputIndex] &&
              txData.inputs[inputIndex].$kind === 'Pure' &&
              txData.inputs[inputIndex].Pure?.bytes) {

            // Get the base64 encoded bytes
            const base64Bytes = txData.inputs[inputIndex].Pure.bytes;

            try {
              // Decode base64 to get the amount
              // This is a simplified approach - in production you'd want more robust parsing
              // For SUI, we assume the value is a little-endian 64-bit integer
              const binaryString = atob(base64Bytes);
              let value = 0;

              // Parse the first 8 bytes as a little-endian 64-bit integer
              // This is a simplified approach and might not work for all values
              for (let i = 0; i < Math.min(binaryString.length, 8); i++) {
                value += binaryString.charCodeAt(i) * Math.pow(256, i);
              }

              // Set the estimated coin spent
              summary.estimatedCoinSpent = {
                amount: value.toString(),
                amountInSui: (value / 1_000_000_000).toFixed(9),
                coinType: '0x2::sui::SUI' // Assuming SUI for now
              };
            } catch (e) {
              console.error('Error parsing SplitCoins amount:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error processing SplitCoins command:', e);
      }
    }
  });

  return summary;
};

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
                                                                        transaction,
                                                                        isLoading,
                                                                        error
                                                                      }) => {
  if (isLoading) {
    return <div className="p-4 bg-gray-50">Loading transaction summary...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700">{error.message}</div>;
  }

  if (!transaction) {
    return <div className="p-4 bg-red-50 text-red-700">Transaction summary not available</div>;
  }

  const transactionSummary = useMemo(() => extractTransactionSummary(transaction, null), [transaction]);

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
                {transactionSummary.moveCalls.map((call, index) => (
                    <li key={index} className="text-sm">
                <span className="font-mono text-blue-700">
                  {call.package.substring(0, 8)}...{call.package.substring(call.package.length - 4)}::
                  {call.module}::{call.function}
                </span>
                    </li>
                ))}
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
                  {op.type === 'send' ? 'Send' : 'Receive'} {op.amount} {op.coinType}
                </span>
                    </li>
                ))}
              </ul>
            </div>
        )}
      </div>
  );
};