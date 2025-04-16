import { Registration } from '@mcp3/common';
import { z } from 'zod';
import { WalletManager } from '../manager/index.js';
import { Transaction } from '@mysten/sui/transactions';

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
      transactionBytes: z.string().describe('The transaction bytes to sign (base64 encoded)')
    },
    callback: async ({ identifier, transactionBytes }, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // Create transaction block from bytes
        const txBlock = Transaction.from(transactionBytes);

        // Sign the transaction
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
      transactionBytes: z.string().describe('The transaction bytes to sign and execute (base64 encoded)')
    },
    callback: async ({ identifier, transactionBytes }, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // Create transaction block from bytes
        const txBlock = Transaction.from(transactionBytes);

        // Sign and execute the transaction
        const result = await walletManager.signAndExecuteTransaction(identifier, txBlock);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
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
