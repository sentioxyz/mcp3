import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { WalletManager } from '../wallet-manager.js';
import { ConfigFileWalletPersistence, EnvVarWalletPersistence } from '../persistence/index.js';

describe('WalletManager', () => {
  // Create a temporary directory for test config files
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wallet-manager-test-'));
  const testConfigPath = path.join(tempDir, 'test-wallet-config.yaml');

  // Mock environment variables
  const originalEnv = { ...process.env };

  // We'll use a simple approach for testing without mocking SuiClient

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };

    // Clean up any existing test config file
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Clean up test config file after each test
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }

    // Reset environment variables
    process.env = { ...originalEnv };
  });

  describe('Wallet Generation', () => {
    it('should generate a new wallet with random keypair', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const { walletInfo, mnemonic } = walletManager.generateWallet('Test Wallet');

      assert.ok(walletInfo, 'Wallet info should be returned');
      assert.ok(walletInfo.address, 'Wallet should have an address');
      assert.strictEqual(walletInfo.name, 'Test Wallet', 'Wallet should have the specified name');
      assert.ok(mnemonic, 'Mnemonic should be returned');
      assert.ok(walletInfo.credentials?.mnemonic, 'Wallet credentials should include mnemonic');
      assert.strictEqual(walletInfo.credentials?.mnemonic, mnemonic, 'Wallet credentials mnemonic should match returned mnemonic');
    });

    it('should generate a wallet with default name if none provided', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const { walletInfo } = walletManager.generateWallet();

      assert.ok(walletInfo.name.startsWith('Wallet-'), 'Default wallet name should start with "Wallet-"');
    });
  });

  describe('Wallet Management', () => {
    it('should add a wallet with credentials', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const testAddress = '0x123456789abcdef';
      const testName = 'Test Wallet';
      const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      walletManager.addWallet(testAddress, testName, { mnemonic: testMnemonic });
      const wallet = walletManager.getWallet(testName);

      assert.ok(wallet, 'Wallet should be retrievable by name');
      assert.strictEqual(wallet?.address, testAddress, 'Wallet address should match');
      assert.strictEqual(wallet?.name, testName, 'Wallet name should match');
      assert.strictEqual(wallet?.credentials?.mnemonic, testMnemonic, 'Wallet mnemonic should match');
    });

    it('should retrieve a wallet by address', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const testAddress = '0x123456789abcdef';
      const testName = 'Test Wallet';

      walletManager.addWallet(testAddress, testName);
      const wallet = walletManager.getWallet(testAddress);

      assert.ok(wallet, 'Wallet should be retrievable by address');
      assert.strictEqual(wallet?.address, testAddress, 'Wallet address should match');
      assert.strictEqual(wallet?.name, testName, 'Wallet name should match');
    });

    it('should retrieve a wallet by name', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const testAddress = '0x123456789abcdef';
      const testName = 'Test Wallet';

      walletManager.addWallet(testAddress, testName);
      const wallet = walletManager.getWallet(testName);

      assert.ok(wallet, 'Wallet should be retrievable by name');
      assert.strictEqual(wallet?.address, testAddress, 'Wallet address should match');
      assert.strictEqual(wallet?.name, testName, 'Wallet name should match');
    });

    it('should return null for non-existent wallet', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const wallet = walletManager.getWallet('NonExistentWallet');

      assert.strictEqual(wallet, null, 'Should return null for non-existent wallet');
    });

    it('should set default wallet by address', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const address1 = '0x123456789abcdef';
      const address2 = '0xfedcba987654321';

      walletManager.addWallet(address1, 'Wallet 1');
      walletManager.addWallet(address2, 'Wallet 2');

      const result = walletManager.setDefaultWallet(address2);
      const defaultWallet = walletManager.getWallet(); // No argument should return default wallet

      assert.strictEqual(result, true, 'Setting default wallet should succeed');
      assert.ok(defaultWallet, 'Default wallet should exist');
      assert.strictEqual(defaultWallet?.address, address2, 'Default wallet address should match');
    });

    it('should set default wallet by name', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const address1 = '0x123456789abcdef';
      const address2 = '0xfedcba987654321';
      const name1 = 'Wallet 1';
      const name2 = 'Wallet 2';

      walletManager.addWallet(address1, name1);
      walletManager.addWallet(address2, name2);

      const result = walletManager.setDefaultWallet(name2);
      const defaultWallet = walletManager.getWallet(); // No argument should return default wallet

      assert.strictEqual(result, true, 'Setting default wallet should succeed');
      assert.ok(defaultWallet, 'Default wallet should exist');
      assert.strictEqual(defaultWallet?.address, address2, 'Default wallet address should match');
      assert.strictEqual(defaultWallet?.name, name2, 'Default wallet name should match');
    });

    it('should return false when setting non-existent wallet as default', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const result = walletManager.setDefaultWallet('NonExistentWallet');

      assert.strictEqual(result, false, 'Setting non-existent wallet as default should fail');
    });
  });

  describe('Wallet Persistence', () => {
    it('should save and load wallets using ConfigFileWalletPersistence', () => {
      // Create a wallet manager with file persistence
      const persistence = new ConfigFileWalletPersistence(testConfigPath);
      const walletManager1 = new WalletManager({ persistence });

      // Add a wallet
      const testAddress = '0x123456789abcdef';
      const testName = 'Test Wallet';
      walletManager1.addWallet(testAddress, testName);

      // Create a new wallet manager with the same persistence
      const walletManager2 = new WalletManager({ persistence });
      const wallet = walletManager2.getWallet(testName);

      assert.ok(wallet, 'Wallet should be loaded from persistence');
      assert.strictEqual(wallet?.address, testAddress, 'Wallet address should match');
      assert.strictEqual(wallet?.name, testName, 'Wallet name should match');
    });

    it('should use EnvVarWalletPersistence when environment variables are set', () => {
      // Set environment variables
      process.env.SUI_WALLET_ADDRESSES = '0x123456789abcdef';
      process.env.SUI_WALLET_NAMES = 'Env Wallet';
      process.env.SUI_DEFAULT_WALLET = '0x123456789abcdef';

      // Create a wallet manager without explicit persistence
      const walletManager = new WalletManager();
      const wallet = walletManager.getWallet('Env Wallet');

      assert.ok(wallet, 'Wallet should be loaded from environment variables');
      assert.strictEqual(wallet?.address, '0x123456789abcdef', 'Wallet address should match');
      assert.strictEqual(wallet?.name, 'Env Wallet', 'Wallet name should match');
    });
  });

  describe('Wallet Credentials', () => {
    it('should export mnemonic for a wallet', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      walletManager.addWallet('0x123456789abcdef', 'Test Wallet', { mnemonic: testMnemonic });
      const exportedMnemonic = walletManager.exportMnemonic('Test Wallet');

      assert.strictEqual(exportedMnemonic, testMnemonic, 'Exported mnemonic should match');
    });

    it('should return null when exporting mnemonic for a wallet without one', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });

      walletManager.addWallet('0x123456789abcdef', 'Test Wallet'); // No credentials
      const exportedMnemonic = walletManager.exportMnemonic('Test Wallet');

      assert.strictEqual(exportedMnemonic, null, 'Should return null for wallet without mnemonic');
    });

    it('should return null when exporting mnemonic for non-existent wallet', () => {
      const walletManager = new WalletManager({ walletConfig: testConfigPath });
      const exportedMnemonic = walletManager.exportMnemonic('NonExistentWallet');

      assert.strictEqual(exportedMnemonic, null, 'Should return null for non-existent wallet');
    });
  });

  // Note: Network operations like getBalance() would require more complex mocking
  // and are better tested in integration tests
});
