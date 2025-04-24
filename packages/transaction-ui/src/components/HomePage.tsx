import React, { useState } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const HomePage: React.FC = () => {
  const [transactionBytes, setTransactionBytes] = useState('');
  const [selectedChain, setSelectedChain] = useState('sui');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ txId: string; url: string } | null>(null);
  const navigate = useNavigate();

  const handleRegisterTransaction = async () => {
    if (!transactionBytes.trim()) {
      setError('Please enter transaction bytes');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Call the API to register the transaction
      const response = await fetch('/api/sui/tx', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: transactionBytes.trim(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register transaction: ${errorText}`);
      }

      const result = await response.json();
      setSuccess({
        txId: result.txId,
        url: result.url,
      });

      // Automatically navigate to the transaction page
      navigate(`/sui/tx/${result.txId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold mb-2">MCP3 Transaction Server</h1>
        </div>
        <div className="flex-shrink-0">
          <ConnectButton connectText="Connect Wallet" />
        </div>
      </div>

      <div className="py-8">
        <h2 className="text-4xl font-bold mb-6 text-center">Welcome to Transaction Server</h2>
        <p className="text-xl mb-8 text-center">A powerful platform for Sui transaction signing and submission</p>

        <div className="mb-8">
          <div className="mb-4">
            <div className="flex flex-col space-y-4 mb-2">
              <div className="flex items-center gap-4">
                <label htmlFor="chain" className="text-sm font-medium whitespace-nowrap">
                  Chain:
                </label>
                <div className="w-40">
                  <Select
                    value={selectedChain}
                    onValueChange={setSelectedChain}
                  >
                    <SelectTrigger className="w-full shadow-none">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sui">Sui</SelectItem>
                      <SelectItem value="eth" disabled>Ethereum (Coming soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label htmlFor="txBytes" className="block text-sm font-medium">
                Transaction Bytes (Base64 encoded)
              </label>
            </div>
            <Textarea
              id="txBytes"
              className="w-full h-32 shadow-none"
              placeholder="Paste your base64 encoded transaction bytes here"
              value={transactionBytes}
              onChange={(e) => setTransactionBytes(e.target.value)}
            />
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleRegisterTransaction}
              disabled={isLoading || !transactionBytes.trim()}
              className="px-6 py-3 shadow-none"
            >
              {isLoading ? 'Submitting...' : `Submit ${selectedChain.toUpperCase()} Transaction`}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md shadow-none">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-md shadow-none">
              <p className="font-medium">Transaction registered successfully!</p>
              <p className="mt-2">Redirecting to transaction page...</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};
