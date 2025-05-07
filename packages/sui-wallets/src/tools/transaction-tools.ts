import { Registration, transactionStore } from '@mcp3/common';
import { z } from 'zod';
import { WalletManager } from '../manager/wallet-manager.js';
import { Transaction } from '@mysten/sui/transactions';
import { TransactionServerClient, getServerUrl } from '@mcp3/transaction-server';


async function registerTransactionWithServer(txBytes: string, walletAddress: string): Promise<{ url: string, txId: string }> {
  // Create a transaction server client
  const transactionClient = new TransactionServerClient(getServerUrl());

  try {
    // Register the transaction with the server
    const result = await transactionClient.registerTransaction(txBytes);
    return { url: result.url, txId: result.txId };
  } catch (error) {
    throw new Error(`Failed to register transaction for wallet ${walletAddress}. The transaction server might be unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Register transaction-related tools with the Registration
 * @param registration The Registration instance
 */
export function registerTransactionTools(registration: Registration) {
  // Register the tool for signing a transaction
  registration.addTool({
    name: 'sui-wallets-sign-transaction',
    description: 'Sign a transaction with a wallet',
    args: {
      identifier: z.string().describe('The wallet address or name to sign with (optional, uses default if not provided)').optional(),
      transactionId: z.string().optional().describe('The transaction ID in the transaction store to sign').optional(),
      transactionBytes: z.string().optional().describe('The transaction bytes to sign (base64 encoded), use this if transactionId is not stored in the transaction store')
    },
    callback: async ({ identifier, transactionId, transactionBytes }, _extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // If transactionId is provided but not transactionBytes, try to get it from the store
        if (transactionId && !transactionBytes) {
          const storedTx = transactionStore.getTransaction(transactionId);
          if (!storedTx) {
            throw new Error(`Transaction with ID ${transactionId} not found in the transaction store`);
          }
          transactionBytes = storedTx.txBytes;
        }

        // Ensure we have transaction bytes at this point
        if (!transactionBytes) {
          throw new Error('Either transactionId or transactionBytes must be provided');
        }

        // Create transaction block from bytes
        const txBlock = Transaction.from(transactionBytes);

        // Check if wallet exists and has a keypair
        const wallet = walletManager.getWallet(identifier);

        // If wallet doesn't exist or doesn't have a keypair, use transaction server
        if (!wallet || !wallet.keypair) {
          // Determine the address to use
          const address = wallet ? wallet.address : (identifier || 'unknown');

          // Register the transaction with the server
          const result = await registerTransactionWithServer(transactionBytes, address);

          // Return the URL for external signing
          return {
            content: [{
              type: 'text',
              text: `This wallet requires external signing. Please open the following URL in your browser:\n\n${result.url}\n\n`
            }]
          };
        }

        // If wallet exists and has a keypair, sign the transaction
        const signedTx = await walletManager.signTransaction(identifier, txBlock);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              bytes: signedTx.bytes,
              signature: signedTx.signature
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to sign transaction: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Register the tool for signing and executing a transaction
  registration.addTool({
    name: 'sui-wallets-execute-transaction',
    description: 'Sign and execute a transaction with a wallet',
    args: {
      identifier: z.string().describe('The wallet address or name to sign with (optional, uses default if not provided)').optional(),
      transactionId: z.string().describe('The transaction ID in the transaction store to sign and execute').optional(),
      transactionBytes: z.string().describe('The transaction bytes to sign and execute (base64 encoded), use this if transactionId is not stored in the transaction store').optional()
    },
    callback: async ({ identifier, transactionId, transactionBytes }, _extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // If transactionId is provided but not transactionBytes, try to get it from the store
        if (transactionId && !transactionBytes) {
          const storedTx = transactionStore.getTransaction(transactionId);
          if (!storedTx) {
            throw new Error(`Transaction with ID ${transactionId} not found in the transaction store`);
          }
          transactionBytes = storedTx.txBytes;
        }

        // Ensure we have transaction bytes at this point
        if (!transactionBytes) {
          throw new Error('Either transactionId or transactionBytes must be provided');
        }

        // Create transaction block from bytes
        const txBlock = Transaction.from(transactionBytes);

        // Check if wallet exists and has a keypair
        const wallet = walletManager.getWallet(identifier);

        // If wallet doesn't exist or doesn't have a keypair, use transaction server
        if (!wallet || !wallet.keypair) {
          // Determine the address to use
          const address = wallet ? wallet.address : (identifier || 'unknown');

          // Register the transaction with the server
          const result = await registerTransactionWithServer(transactionBytes, address);

          // Return the URL for external signing
          return {
            content: [{
              type: 'text',
              text: `This wallet requires external signing. Please open the following URL in your browser:\n\n${result.url}\n\n`
            }]
          };
        }

        // If wallet exists and has a keypair, sign and execute the transaction
        const result = await walletManager.signAndExecuteTransaction(identifier, txBlock);

        return {
          content: [{
            type: 'resource',
            resource: {
              uri: `sui://tx/${result.digest}`,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2)
            },
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to execute transaction: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Create transfer tool has been removed as requested
}
