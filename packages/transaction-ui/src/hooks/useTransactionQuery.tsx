import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import { useSuiClient } from '@mysten/dapp-kit';
import { fromBase64 } from '@mysten/sui/utils';
import { useState } from 'react';

interface FetchTransactionOptions {
  txId?: string;
}

export function useTransactionQuery({ txId: initialTxId }: FetchTransactionOptions) {
  const suiClient = useSuiClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query to fetch transaction data
  const {
    data: transactionData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['transaction', initialTxId],
    queryFn: async () => {
      // Otherwise, fetch from API
      if (!initialTxId) {
        throw new Error('Transaction ID not found');
      }

      const response = await fetch(`/api/sui/tx/${initialTxId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transaction data');
      }

      const data = await response.json() as string;
      debugger

      const tx = Transaction.from(data);
      return {
        txId: initialTxId,
        txBytes: data,
        transaction: tx
       };
    },
    enabled: !!initialTxId,
    staleTime: Infinity, // Transaction data doesn't change once fetched
  });

  // Function to submit transaction with signature directly using Sui SDK
  const submitTransaction = async (signature: string): Promise<boolean> => {
    if (!transactionData?.txBytes) {
      return false;
    }

    try {
      setIsSubmitting(true);

      // Convert the transaction bytes to the format expected by the Sui client
      const txBytes = fromBase64(transactionData.txBytes);

      // Submit the transaction directly to the Sui network
      const response = await suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: signature,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      console.log('Transaction submitted successfully:', response);
      return true;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    txId: transactionData?.txId || null,
    txBytes: transactionData?.txBytes || null,
    transaction: transactionData?.transaction || null,
    isLoading,
    error: error as Error | null,
    submitTransaction,
    isSubmitting
  };
}
