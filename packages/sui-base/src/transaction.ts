import {Transaction} from '@mysten/sui/transactions';
import {SuiClient} from '@mysten/sui/client';
import {toBase64} from '@mysten/sui/utils';
import { transactionStore } from '@mcp3/common'
/**
 * Helper function to convert a transaction to a resource
 * @param tx Transaction object
 * @param client SuiClient instance
 * @param useStore Whether to use the transaction store, the transaction bytes is usually too long for LLM to handle, use store to save some tokens
 * @returns Resource object
 */
export async function transactionToResource(tx: Transaction, client: SuiClient, useStore: boolean = true) {
  const hash = await tx.getDigest({client});
  let bytes = await tx.build({client});
  if (useStore) {
    // Store the transaction in the transaction store for later use
    transactionStore.addTransaction(hash, tx, toBase64(bytes));

    return {
      uri: `sui://tx/${hash}`,
      mimeType: 'text/plain',
      text: `<The transaction bytes has been stored in the transaction store for later use, use the transaction ID ${hash} to execute it.>`
    };
  } else {
    return {
      uri: `sui://tx/${hash}`,
      mimeType: 'application/json',
      text: JSON.stringify({
        digest: hash,
        bytes: toBase64(bytes),
        data: tx.getData()
      }, null, 2)
    };
  }
}
