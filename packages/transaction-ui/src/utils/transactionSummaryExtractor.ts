import { Transaction } from '@mysten/sui/transactions';

/**
 * Interface for transaction summary
 * Provides structured information about a transaction for display
 */
export interface TransactionSummary {
  /** Transaction ID (digest) */
  txId: string | null;
  
  /** Gas data for the transaction */
  gasData: {
    /** Gas budget in MIST */
    budget: string;
    /** Gas price in MIST */
    price: string;
  };
  
  /** Move function calls in the transaction */
  moveCalls: Array<{
    /** Package ID */
    package: string;
    /** Module name */
    module: string;
    /** Function name */
    function: string;
  }>;
  
  /** Coin operations (transfers, etc.) */
  coinOperations: Array<{
    /** Type of operation */
    type: 'send' | 'receive';
    /** Amount in base units (MIST for SUI) */
    amount: string;
    /** Formatted amount in SUI */
    amountInSui?: string;
    /** Coin type (e.g., 0x2::sui::SUI) */
    coinType: string;
    /** Recipient address (for send operations) */
    recipient?: string;
  }>;
  
  /** Estimated total coin spent in the transaction */
  estimatedCoinSpent?: {
    /** Amount in base units (MIST for SUI) */
    amount: string;
    /** Formatted amount in SUI */
    amountInSui: string;
    /** Coin type (e.g., 0x2::sui::SUI) */
    coinType: string;
  };
}

/**
 * Extracts a summary of the transaction for display
 * @param tx The transaction object
 * @param id The transaction ID (optional)
 * @returns A structured summary of the transaction
 */
export function extractTransactionSummary(tx: Transaction, id: string | null): TransactionSummary {
  const txData = tx.getData();
  
  // Get transaction ID - handle both sync and async getDigest
  let txId = id;
  if (!txId && tx.getDigest) {
    try {
      // If getDigest returns a string directly
      const digest = tx.getDigest();
      if (typeof digest === 'string') {
        txId = digest;
      }
      // If it's a Promise, we'll just use null and let the UI handle it
    } catch (e) {
      console.error('Error getting transaction digest:', e);
    }
  }
  
  const summary: TransactionSummary = {
    txId,
    gasData: {
      budget: String(txData.gasData?.budget || '0'),
      price: String(txData.gasData?.price || '0'),
    },
    moveCalls: [],
    coinOperations: []
  };

  // Extract commands from transaction
  const commands = txData.commands || [];
  
  // Track potential recipients for TransferObjects
  let potentialRecipient: string | null = null;
  
  // Type-safe command processing
  commands.forEach((cmd: Record<string, unknown>, index: number) => {
    // Process MoveCall commands
    if (cmd.$kind === 'MoveCall' && typeof cmd.MoveCall === 'object' && cmd.MoveCall !== null) {
      const moveCall = cmd.MoveCall as Record<string, unknown>;
      const packageId = String(moveCall.package || 'unknown');
      const module = String(moveCall.module || 'unknown');
      const func = String(moveCall.function || 'unknown');
      
      summary.moveCalls.push({
        package: packageId,
        module: module,
        function: func,
      });
      
      // Check if this is a common coin transfer function
      if ((module === 'coin' || module === 'pay') && 
          (func === 'transfer' || func === 'pay' || func === 'split_and_transfer')) {
        // This might be a coin transfer - we could extract recipient from arguments
        try {
          const args = moveCall.arguments;
          if (Array.isArray(args) && args.length > 1) {
            // Find an argument that might be an input (recipient)
            for (let i = 0; i < args.length; i++) {
              const arg = args[i] as Record<string, unknown>;
              if (arg && arg.$kind === 'Input' && typeof arg.Input === 'number') {
                const inputIndex = arg.Input;
                // Try to get the input data
                if (Array.isArray(txData.inputs) && txData.inputs.length > inputIndex) {
                  const inputData = txData.inputs[inputIndex] as Record<string, unknown>;
                  // Extract address if available
                  if (inputData.$kind === 'Input' && 
                      typeof inputData.Input === 'object' && 
                      inputData.Input !== null &&
                      'address' in inputData.Input) {
                    potentialRecipient = String(inputData.Input.address);
                    break;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error('Error extracting recipient from MoveCall:', e);
        }
      }
    } 
    // Process TransferObjects commands
    else if (cmd.$kind === 'TransferObjects' && typeof cmd.TransferObjects === 'object' && cmd.TransferObjects !== null) {
      try {
        const transferObj = cmd.TransferObjects as Record<string, unknown>;
        // Check if we have a recipient
        const recipient = transferObj.recipient as Record<string, unknown>;
        
        if (recipient && recipient.$kind === 'Input' && typeof recipient.Input === 'number') {
          const recipientInputIndex = recipient.Input;
          
          // Try to get the recipient address from inputs
          let recipientAddress: string | undefined;
          
          if (Array.isArray(txData.inputs) && txData.inputs.length > recipientInputIndex) {
            const inputData = txData.inputs[recipientInputIndex] as Record<string, unknown>;
            
            // Safely extract the recipient address
            if (inputData.$kind === 'Input' && 
                typeof inputData.Input === 'object' && 
                inputData.Input !== null &&
                'address' in inputData.Input) {
              recipientAddress = String(inputData.Input.address);
            }
          }
          
          if (recipientAddress) {
            // Add a coin operation with the recipient
            summary.coinOperations.push({
              type: 'send',
              amount: 'unknown', // Still need object resolution
              coinType: 'unknown', // Still need object resolution
              recipient: recipientAddress
            });
          } else {
            // Fallback to basic coin operation
            summary.coinOperations.push({
              type: 'send',
              amount: 'unknown',
              coinType: 'unknown',
              recipient: potentialRecipient || 'unknown'
            });
          }
        } else {
          // Fallback if we can't determine the recipient
          summary.coinOperations.push({
            type: 'send',
            amount: 'unknown',
            coinType: 'unknown'
          });
        }
      } catch (e) {
        console.error('Error processing TransferObjects command:', e);
        summary.coinOperations.push({
          type: 'send',
          amount: 'unknown',
          coinType: 'unknown'
        });
      }
    } 
    // Process SplitCoins commands
    else if (cmd.$kind === 'SplitCoins' && typeof cmd.SplitCoins === 'object' && cmd.SplitCoins !== null) {
      // Try to extract the amount from SplitCoins operation
      try {
        const splitCoins = cmd.SplitCoins as Record<string, unknown>;
        const coin = splitCoins.coin as Record<string, unknown>;
        const amounts = splitCoins.amounts as Array<Record<string, unknown>>;
        
        // Check if this is a GasCoin split
        if (coin && coin.$kind === 'GasCoin' &&
            Array.isArray(amounts) && amounts.length > 0 &&
            amounts[0].$kind === 'Input' && typeof amounts[0].Input === 'number') {

          // Get the input index
          const inputIndex = amounts[0].Input;

          // Try to get the corresponding input value
          if (Array.isArray(txData.inputs) && txData.inputs.length > inputIndex) {
            const inputData = txData.inputs[inputIndex] as Record<string, unknown>;
            
            if (inputData.$kind === 'Pure' && 
                typeof inputData.Pure === 'object' && 
                inputData.Pure !== null &&
                'bytes' in inputData.Pure) {

              // Get the base64 encoded bytes
              const base64Bytes = String(inputData.Pure.bytes);

              try {
                // Decode base64 to get the amount
                const binaryString = atob(base64Bytes);
                let value = 0;

                // Parse the first 8 bytes as a little-endian 64-bit integer
                for (let i = 0; i < Math.min(binaryString.length, 8); i++) {
                  value += binaryString.charCodeAt(i) * Math.pow(256, i);
                }

                // Set the estimated coin spent
                summary.estimatedCoinSpent = {
                  amount: value.toString(),
                  amountInSui: (value / 1_000_000_000).toFixed(9),
                  coinType: '0x2::sui::SUI' // Assuming SUI for now
                };
                
                // Check if the next command is TransferObjects - this is a common pattern for transfers
                if (commands[index + 1] && commands[index + 1].$kind === 'TransferObjects') {
                  // This SplitCoins is likely part of a transfer operation
                  // We'll enhance the next TransferObjects with this amount information
                  if (summary.coinOperations.length > 0) {
                    const lastOpIndex = summary.coinOperations.length - 1;
                    summary.coinOperations[lastOpIndex].amount = value.toString();
                    summary.coinOperations[lastOpIndex].amountInSui = (value / 1_000_000_000).toFixed(9);
                    summary.coinOperations[lastOpIndex].coinType = '0x2::sui::SUI';
                  }
                }
              } catch (e) {
                console.error('Error parsing SplitCoins amount:', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error processing SplitCoins command:', e);
      }
    }
    // Process MergeCoins commands (often used in transactions)
    else if (cmd.$kind === 'MergeCoins') {
      // MergeCoins is often used in transactions, but doesn't need special handling for the summary
      // We could add more detailed processing here if needed
    }
  });

  return summary;
}
