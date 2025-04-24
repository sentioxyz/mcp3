import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { TransactionSummary } from '@/components/TransactionSummary';
import { TransactionDetails } from '@/components/TransactionDetails';
import { TransactionSigning } from '@/components/TransactionSigning';
import { useTransactionQuery } from '@/hooks/useTransactionQuery';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import '@mysten/dapp-kit/dist/index.css';

// Main transaction page content component
interface TransactionPageContentProps {
  txId?: string;
  txBytes?: string;
}

export const TransactionPage: React.FC<TransactionPageContentProps> = ({ txId: initialTxId }) => {
  const [openItems, setOpenItems] = React.useState<string[]>(["summary"]);
  const {
    txId,
    txBytes,
    transaction,
    isLoading,
    error,
    submitTransaction,
    isSubmitting
  } = useTransactionQuery({ txId: initialTxId });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold mb-2">Sign Sui Transaction</h1>
          <p className="text-gray-600">This transaction requires your approval using a Sui wallet.</p>
        </div>
        <div className="flex-shrink-0">
          <ConnectButton connectText="Connect Wallet" />
        </div>
      </div>

      <div className="mb-8">
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
          className="w-full border border-gray-200 rounded-lg overflow-hidden"
        >
          <AccordionItem value="summary" className="border-b">
            <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100">
              Transaction Summary
            </AccordionTrigger>
            <AccordionContent className="p-4 bg-white">
              <TransactionSummary
                transaction={transaction}
                isLoading={isLoading}
                error={error}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="details" className="border-0">
            <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100">
              Transaction Details
            </AccordionTrigger>
            <AccordionContent className="bg-white">
              <TransactionDetails
                transaction={transaction}
                isLoading={isLoading}
                error={error}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <TransactionSigning
        txId={txId}
        txBytes={txBytes}
        submitTransaction={submitTransaction}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
