import {Registration} from '@mcp3/common';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';

export function registerCetusResource(registration: Registration) {
    registration.addResource({
        name: "cetus",
        uri: "sui:///projects/cetus",
        callback: async (uri) => {
            const sdk = initCetusSDK({
                network: 'mainnet',
                fullNodeUrl: registration.globalOptions.nodeUrl
            });

            // Get some basic information about Cetus pools
            const pools = await sdk.Pool.getPoolsWithPage([]);
            
            // Format pool information
            const poolInfo = pools.slice(0, 5).map(pool => {
                return {
                    name: pool.name,
                    id: pool.poolAddress,
                    coinTypeA: pool.coinTypeA,
                    coinTypeB: pool.coinTypeB,
                    feeRate: pool.fee_rate
                };
            });

            return {
                contents: [
                    {
                        uri: uri.toString(),
                        mimeType: "text/plain",
                        text: `
## Cetus Protocol Information

Cetus is a concentrated liquidity protocol on the Sui Network.

### Important Addresses
- Package ID: ${process.env.CETUS_PACKAGE_ID || '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb'}
- CLMM Package ID: ${process.env.CETUS_CLMM_PACKAGE_ID || '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb'}
- Global Config ID: ${process.env.CETUS_GLOBAL_CONFIG_ID || '0x6f4149091a5aea0e818e7243a13adcfb3d98b465a618f9d4e2ab3ab96b0470cd'}

### Popular Pools
${JSON.stringify(poolInfo, null, 2)}

### Features
- Concentrated Liquidity Market Maker (CLMM)
- Multiple fee tiers
- Position management
- Rewards and fees collection
- APR calculation

### Documentation
For more information, visit the [Cetus Developer Docs](https://cetus-1.gitbook.io/cetus-developer-docs/).
`
                    }
                ]
            };
        }
    });
}
