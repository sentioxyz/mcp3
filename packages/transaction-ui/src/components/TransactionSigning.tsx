import React, {useState} from 'react';
import {useSignTransaction, useCurrentWallet, useCurrentAccount} from '@mysten/dapp-kit';
import {Button} from '@/components/ui/button';

interface TransactionSigningProps {
    txId: string | null;
    txBytes: string | null;
    submitTransaction: (signature: string) => Promise<boolean | string>;
    isSubmitting: boolean;
}

export const TransactionSigning: React.FC<TransactionSigningProps> = ({
                                                                          txBytes,
                                                                          submitTransaction,
                                                                          isSubmitting
                                                                      }) => {
    const {mutateAsync: signTransaction} = useSignTransaction();
    const {currentWallet} = useCurrentWallet();
    const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
    const [txDigest, setTxDigest] = useState<string | null>(null);
    const account = useCurrentAccount();

    const handleSignTransaction = async () => {
        if (!txBytes) {
            setStatus({
                message: 'Transaction data not available',
                type: 'error'
            });
            return;
        }

        if (!currentWallet) {

            return;
        }

        try {
            setStatus({
                message: 'Signing transaction...',
                type: 'info'
            });

            const {signature} = await signTransaction({
                transaction: txBytes,
            });

            setStatus({
                message: 'Transaction signed successfully. Submitting to Sui network...',
                type: 'info'
            });

            const result = await submitTransaction(signature);

            if (typeof result === 'string') {
                setStatus({
                    message: 'Transaction submitted successfully to the Sui network!',
                    type: 'success'
                });
                setTxDigest(result);
            } else if (result === true) {
                setStatus({
                    message: 'Transaction submitted successfully to the Sui network!',
                    type: 'success'
                });
                setTxDigest(null);
            } else {
                setStatus({
                    message: 'Failed to submit transaction to the Sui network',
                    type: 'error'
                });
                setTxDigest(null);
            }
        } catch (error) {
            console.error('Error signing transaction:', error);
            setStatus({
                message: `Error signing transaction: ${error instanceof Error ? error.message : String(error)}`,
                type: 'error'
            });
            setTxDigest(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <Button
                    onClick={handleSignTransaction}
                    disabled={!txBytes || isSubmitting || !account}
                    className="w-full md:w-auto px-8 py-2"
                >
                    {account ? isSubmitting ? 'Submitting to Sui Network...' : 'Sign & Submit Transaction' : 'Connect Wallet To Submit'}
                </Button>
            </div>

            {status && (
                <div
                    className={`p-4 rounded-md ${
                        status.type === 'error'
                            ? 'bg-red-50 text-red-700'
                            : status.type === 'success'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-blue-50 text-blue-700'
                    }`}
                >
                    {status.message}
                    {status.type === 'success' && txDigest && (
                        <div className="mt-2">
                            <a
                                href={`https://suiscan.xyz/tx/${txDigest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-700 hover:text-blue-900"
                            >
                                View on Suiscan
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
