// Export core functionality
import {Registration} from "@mcp3/common";
import * as wallets from "@mcp3/sui-wallets";
import * as navi from "@mcp3/sui-navi";
import * as cetus from "@mcp3/sui-cetus";
import * as defilama from "@mcp3/defilama";
import * as dexScreener from "@mcp3/dex-screener";
import * as sentio from "@mcp3/sentio";

export async function registerSubProjectTools(registration: Registration) {
    await wallets.registerTools(registration);
    await navi.registerTools(registration);
    await cetus.registerTools(registration);
    await defilama.registerTools(registration);
    await dexScreener.registerTools(registration);
    await sentio.registerTools(registration);
}

export function registerSubProjectOptions(registration: Registration) {
    wallets.registerGlobalOptions(registration);
    navi.registerGlobalOptions(registration);
    cetus.registerGlobalOptions(registration);
    defilama.registerGlobalOptions(registration);
    dexScreener.registerGlobalOptions(registration);
    sentio.registerGlobalOptions(registration);
}