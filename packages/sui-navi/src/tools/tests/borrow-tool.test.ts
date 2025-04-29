import { describe, it, beforeEach, afterEach } from 'node:test';
import {TestRegistration, transactionStore} from "@mcp3/common";
import {registerBorrowTool} from "../borrow-tool.js";
import assert from "node:assert";
import {Transaction} from '@mysten/sui/transactions';
import {fromBase64} from '@mysten/sui/utils';

const testWalletAddress = '0x2c0b8007e95e3ef90d4dfe9aee0f9ff7a7f4c3d75cfe6c3f25dd68648a22d7c1'

function verifyTransaction(resource: any) {
  if (resource.text && typeof resource.text === 'string' && resource.text.includes('transaction bytes has been stored')) {
    // Case 1: Transaction is stored in the transaction store
    // Extract transaction ID from the text message
    const txIdMatch = resource.text.match(/transaction ID ([a-zA-Z0-9]+)/);
    assert.ok(txIdMatch, 'Transaction ID should be present in the text');
    
    const txId = txIdMatch![1];
    assert.ok(txId, 'Transaction ID should be extracted from the text');
    
    // Verify the transaction URI contains the transaction ID
    assert.strictEqual(resource.uri, `sui://tx/${txId}`, 'URI should contain the transaction ID');
    
    // Verify the transaction is stored in the transaction store
    const storedTx = transactionStore.getTransaction(txId);
    assert.ok(storedTx, `Transaction with ID ${txId} should be in the transaction store`);
    assert.ok(storedTx.txBytes, 'Transaction bytes should be stored');
    
    return txId;
  } else if (resource.text && typeof resource.text === 'string') {
    // Case 2: Transaction bytes are included directly
    const txData = JSON.parse(resource.text);
    assert.ok(txData.bytes, 'Transaction bytes should be present');
    assert.ok(txData.digest, 'Transaction digest should be present');
    
    // This will throw an error if the bytes are invalid
    const tx = Transaction.from(fromBase64(txData.bytes));
    assert.ok(tx, 'Should be able to create a Transaction from the bytes');
  } else {
    assert.fail('Transaction resource should contain either stored transaction reference or transaction bytes');
  }
}

describe('borrow tool test', () => {
    let testRegistration: TestRegistration;

    beforeEach(() => {
        // Create a new TestRegistration instance for each test
        testRegistration = TestRegistration.createTest('test-registration', 'Test Registration', '1.0.0');
        testRegistration.setGlobalOptions({
            nodeUrl: "https://fullnode.mainnet.sui.io:443"
        })
        registerBorrowTool(testRegistration);
    });

    it('should registered borrow tool', () => {
        const tools = testRegistration.registeredTools;
        assert.ok('sui-navi-borrow' in tools, 'Tool should be in registeredTools');
        assert.strictEqual(tools['sui-navi-borrow'].name, 'sui-navi-borrow', 'Tool name should match');
        assert.strictEqual(tools['sui-navi-borrow'].description, 'Borrow assets from Navi Protocol', 'Tool description should match');
    });

    it.skip('should return transaction when call the borrow tool', async () => {
        const args = {
            coinType: '0x2::sui::SUI',
            amount: 1,
            walletAddress: testWalletAddress
        };

        const result = await testRegistration.call('sui-navi-borrow', args, {});
        const content = result.content[0];
        
        // Basic content validation
        assert.ok(content, 'Result should contain one transaction');
        // Validate transaction data using the extracted method
        verifyTransaction(content);
    })
});