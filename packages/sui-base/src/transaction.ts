import {Transaction} from '@mysten/sui/transactions';
import {SuiClient} from '@mysten/sui/client';
import {toBase64} from '@mysten/sui/utils';

/**
 * Helper function to convert a transaction to a resource
 * @param tx Transaction object
 * @param client SuiClient instance
 * @returns Resource object
 */
export async function transactionToResource(tx: Transaction, client: SuiClient) {
  const hash = await tx.getDigest({client});
  let bytes = await tx.build({client});
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
