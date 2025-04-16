import {Registration} from "@mcp3/common";

/**
 * Add common Sui global options to a Registration
 * @param registration The Registration instance
 */
export function addSuiGlobalOptions(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option('-e, --node-url <nodeUrl>', 'Sui RPC Endpoint URL', process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443')
        command.option('-w, --wallet-address <walletAddress>', 'Sui wallet address', process.env.SUI_WALLET_ADDRESS)
    });
}
