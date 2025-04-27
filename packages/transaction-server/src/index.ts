// Export server functionality
import {Registration} from "@mcp3/common";
import { startTransactionServer, stopTransactionServer } from "./server.js";
import { setServerUrl } from "./utils.js";

export { startTransactionServer, stopTransactionServer } from './server.js';
export type { ServerConfig } from './config.js';
export { TransactionServerClient } from './client.js';
export { setServerUrl, getServerUrl } from './utils.js';
import {Option} from "commander";

export function register(registration: Registration) {
    registration.addServeOption((command) => {
        command.option('-t, --enable-transaction-server', 'Start the transaction server for signing transactions', false);
        command.option('--transaction-server-url <url>', 'The url of transaction server', 'https://tx.mcp3.ai');
        command.addOption(new Option("--transaction-server-port <port>", "Port to listen on")
             .default(3000));
    });


    registration.onServerStart(async (options) => {
        const enabled = options.enableTransactionServer || false
        if (enabled) {
            const serverUrl = await startTransactionServer({
                address: options.walletServerAddress || 'localhost',
                port: options.walletServerPort || 3000
            });
            setServerUrl(serverUrl);
        } else {
            setServerUrl(options.transactionServerUrl);
        }
    });

    registration.onServerClose(async () => {
        await stopTransactionServer();
    });
}