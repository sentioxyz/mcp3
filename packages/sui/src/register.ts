// Export core functionality
import {Registration} from "@mcp3/common";
import {register as RegisterWallets} from "@mcp3/sui-wallets";
import {register as RegisterNavi} from "@mcp3/sui-navi";
import {register as RegisterCetus} from "@mcp3/sui-cetus";
import {register as RegisterDefilama} from "@mcp3/defilama";
import {register as RegisterDexScreener} from "@mcp3/dex-screener";
import {register as RegisterTxServer} from "@mcp3/transaction-server";
import {register as RegisterSentio} from "@mcp3/sentio";

export async function registerSubProjects(registration: Registration) {
    await RegisterWallets(registration);
    await RegisterNavi(registration);
    await RegisterCetus(registration);
    await RegisterDefilama(registration);
    await RegisterDexScreener(registration);
    await RegisterSentio(registration);
    await RegisterTxServer(registration);
}