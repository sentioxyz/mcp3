export {
  WalletManager,
  type WalletInfo,
  type WalletCredentials,
  type WalletConfig,
  type WalletManagerOptions
} from './wallet-manager.js';

export type { WalletPersistence } from './persistence/wallet-persistence.js';
export {
  ConfigFileWalletPersistence,
  EnvVarWalletPersistence
} from './persistence/index.js';
