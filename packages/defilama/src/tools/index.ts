import {Registration} from "@mcp3/common";
import {z} from 'zod';
import {paths} from '../generated.js';
import createClient from "openapi-fetch";
import {toMarkdown,  toResult} from '../util.js';
import {withCachedResult} from "../cache.js";

/**
 * Register all DeFiLlama tools with the Registration
 * @param registration The Registration instance
 */
export function registerTools(registration: Registration) {

    // Protocol endpoints
    registration.addTool({
        name: 'defilama-get-protocols',
        description: 'List all protocols on DeFiLlama along with their TVL',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/protocols")
            return toResult(`${baseUrl}/protocols`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-protocol',
        description: 'Get historical TVL of a protocol and breakdowns by token and chain',
        args: {
            protocol: z.string().describe('Protocol slug (e.g., "aave")'),
            page: z.number().optional().describe('Page number, default is 0').default(0)
        },
        callback: async ({protocol, page}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const uri = `${baseUrl}/protocol/${protocol}`;
            try {
                const pagedResult: string = await withCachedResult(uri, page, 1048000, async () => {
                    const client = createClient<paths>({baseUrl});
                    const {
                        data,
                        error,
                    } = await client.GET("/protocol/{protocol}", {
                        params: {
                            path: {protocol}
                        }
                    })
                    if (error)
                        throw error
                    return toMarkdown(data)
                })
                return {
                    content: [{
                        type: "resource",
                        resource: [{
                            uri: uri+`?page=${page}`,
                            mimeType: "text/markdown",
                            text: pagedResult
                        }],
                    }]
                } as any
            } catch (e) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get protocol: ${e instanceof Error ? e.message : String(e)}`
                    }],
                    isError: true
                }
            }
        }
    });

    // Historical Chain TVL endpoints
    registration.addTool({
        name: 'defilama-get-historical-chain-tvl',
        description: 'Get historical TVL of all chains',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/v2/historicalChainTvl")
            return toResult(`${baseUrl}/v2/historicalChainTvl`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-historical-chain-tvl-by-chain',
        description: 'Get historical TVL of a specific chain',
        args: {
            chain: z.string().describe('Chain slug (e.g., "ethereum")')
        },
        callback: async ({chain}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/v2/historicalChainTvl/{chain}", {
                params: {
                    path: {chain}
                }
            })
            return toResult(`${baseUrl}/v2/historicalChainTvl/${chain}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-protocol-tvl',
        description: 'Get current TVL of a protocol',
        args: {
            protocol: z.string().describe('Protocol slug (e.g., "aave")')
        },
        callback: async ({protocol}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/tvl/{protocol}", {
                params: {
                    path: {protocol}
                }
            })
            return toResult(`${baseUrl}/tvl/${protocol}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-chains',
        description: 'Get current TVL of all chains',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/v2/chains")
            return toResult(`${baseUrl}/v2/chains`, data, error)
        }
    });

    // Price endpoints
    registration.addTool({
        name: 'defilama-get-current-prices',
        description: 'Get current prices of tokens by contract address',
        args: {
            coins: z.string().describe('Set of comma-separated tokens defined as {chain}:{address}')
        },
        callback: async ({coins}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/prices/current/{coins}", {
                params: {
                    path: {coins}
                }
            })
            return toResult(`${baseUrl}/prices/current/${coins}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-historical-prices',
        description: 'Get historical prices of tokens by contract address at a specific timestamp',
        args: {
            coins: z.string().describe('Set of comma-separated tokens defined as {chain}:{address}'),
            timestamp: z.number().describe('UNIX timestamp of time when you want historical prices')
        },
        callback: async ({coins, timestamp}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/prices/historical/{timestamp}/{coins}", {
                params: {
                    path: {coins, timestamp}
                }
            })
            return toResult(`${baseUrl}/prices/historical/${timestamp}/${coins}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-batch-historical-prices',
        description: 'Get historical prices for multiple tokens at multiple different timestamps',
        args: {
            coins: z.string().describe('Object where keys are coins in the form {chain}:{address}, and values are arrays of requested timestamps')
        },
        callback: async ({coins}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/batchHistorical", {
                params: {
                    query: {coins}
                }
            })
            return toResult(`${baseUrl}/batchHistorical`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-price-chart',
        description: 'Get token prices at regular time intervals',
        args: {
            coins: z.string().describe('Set of comma-separated tokens defined as {chain}:{address}')
        },
        callback: async ({coins}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/chart/{coins}", {
                params: {
                    path: {coins}
                }
            })
            return toResult(`${baseUrl}/chart/${coins}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-price-percentage',
        description: 'Get percentage change in token prices',
        args: {
            coins: z.string().describe('Set of comma-separated tokens defined as {chain}:{address}')
        },
        callback: async ({coins}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/percentage/{coins}", {
                params: {
                    path: {coins}
                }
            })
            return toResult(`${baseUrl}/percentage/${coins}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-first-prices',
        description: 'Get the earliest price available for tokens',
        args: {
            coins: z.string().describe('Set of comma-separated tokens defined as {chain}:{address}')
        },
        callback: async ({coins}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/prices/first/{coins}", {
                params: {
                    path: {coins}
                }
            })
            return toResult(`${baseUrl}/prices/first/${coins}`, data, error)
        }
    });

    // Block endpoint
    registration.addTool({
        name: 'defilama-get-block',
        description: 'Get the closest block to a timestamp',
        args: {
            chain: z.string().describe('Chain which you want to get the block from'),
            timestamp: z.number().describe('UNIX timestamp of the block you are searching for')
        },
        callback: async ({chain, timestamp}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/block/{chain}/{timestamp}", {
                params: {
                    path: {chain, timestamp}
                }
            })
            return toResult(`${baseUrl}/block/${chain}/${timestamp}`, data, error)
        }
    });

    // Stablecoin endpoints
    registration.addTool({
        name: 'defilama-get-stablecoins',
        description: 'List all stablecoins along with their circulating amounts',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/stablecoins")
            return toResult(`${baseUrl}/stablecoins`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-stablecoin-charts-all',
        description: 'Get historical mcap sum of all stablecoins',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/stablecoincharts/all")
            return toResult(`${baseUrl}/stablecoincharts/all`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-stablecoin-charts-by-chain',
        description: 'Get historical mcap sum of all stablecoins in a chain',
        args: {
            chain: z.string().describe('Chain slug, you can get these from /chains or the chains property on /protocols')
        },
        callback: async ({chain}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/stablecoincharts/{chain}", {
                params: {
                    path: {chain}
                }
            })
            return toResult(`${baseUrl}/stablecoincharts/${chain}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-stablecoin-by-asset',
        description: 'Get historical mcap of a stablecoin',
        args: {
            asset: z.number().describe('Stablecoin asset ID')
        },
        callback: async ({asset}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/stablecoin/{asset}", {
                params: {
                    path: {asset}
                }
            })
            return toResult(`${baseUrl}/stablecoin/${asset}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-stablecoin-chains',
        description: 'Get stablecoins chains',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/stablecoinchains")
            return toResult(`${baseUrl}/stablecoinchains`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-stablecoin-prices',
        description: 'Get stablecoins prices',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/stablecoinprices")
            return toResult(`${baseUrl}/stablecoinprices`, data, error)
        }
    });

    // Pool endpoints
    registration.addTool({
        name: 'defilama-get-pools',
        description: 'Retrieve the latest data for all pools, including enriched information such as predictions',
        args: {},
        callback: async (_) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/pools")
            return toResult(`${baseUrl}/pools`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-pool-chart',
        description: 'Get historical data for a specific pool',
        args: {
            pool: z.string().describe('Pool address')
        },
        callback: async ({pool}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/chart/{pool}", {
                params: {
                    path: {pool}
                }
            })
            return toResult(`${baseUrl}/chart/${pool}`, data, error)
        }
    });

    // DEX endpoints
    registration.addTool({
        name: 'defilama-get-dexs-overview',
        description: 'List all dexs along with summaries of their volumes and dataType history data',
        args: {
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["dailyVolume", "totalVolume"]).optional().describe('Desired data type, dailyVolume by default')
        },
        callback: async (args) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/overview/dexs", {
                params: {
                    query: args
                }
            })
            return toResult(`${baseUrl}/overview/dexs`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-dexs-overview-by-chain',
        description: 'List all dexs along with summaries of their volumes and dataType history data filtering by chain',
        args: {
            chain: z.string().describe('Chain name, list of all supported chains can be found under allChains attribute in /overview/dexs response'),
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["dailyVolume", "totalVolume"]).optional().describe('Desired data type, dailyVolume by default')
        },
        callback: async ({chain, ...queryParams}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/overview/dexs/{chain}", {
                params: {
                    path: {chain},
                    query: queryParams
                }
            })
            return toResult(`${baseUrl}/overview/dexs/${chain}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-dex-summary',
        description: 'Get summary of dex volume with historical data',
        args: {
            protocol: z.string().describe('Protocol slug'),
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["dailyVolume", "totalVolume"]).optional().describe('Desired data type, dailyVolume by default')
        },
        callback: async ({protocol, ...queryParams}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/summary/dexs/{protocol}", {
                params: {
                    path: {protocol},
                    query: queryParams
                }
            })
            return toResult(`${baseUrl}/summary/dexs/${protocol}`, data, error)
        }
    });

    // Options endpoints
    registration.addTool({
        name: 'defilama-get-options-overview',
        description: 'List all options dexs along with summaries of their volumes and dataType history data',
        args: {
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["dailyPremiumVolume", "dailyNotionalVolume", "totalPremiumVolume", "totalNotionalVolume"]).optional().describe('Desired data type, dailyNotionalVolume by default')
        },
        callback: async (args) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/overview/options", {
                params: {
                    query: args
                }
            })
            return toResult(`${baseUrl}/overview/options`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-options-overview-by-chain',
        description: 'List all options dexs along with summaries of their volumes and dataType history data filtering by chain',
        args: {
            chain: z.string().describe('Chain name, list of all supported chains can be found under allChains attribute in /overview/options response'),
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["dailyPremiumVolume", "dailyNotionalVolume", "totalPremiumVolume", "totalNotionalVolume"]).optional().describe('Desired data type, dailyNotionalVolume by default')
        },
        callback: async ({chain, ...queryParams}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/overview/options/{chain}", {
                params: {
                    path: {chain},
                    query: queryParams
                }
            })
            return toResult(`${baseUrl}/overview/options/${chain}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-options-summary',
        description: 'Get summary of options dex volume with historical data',
        args: {
            protocol: z.string().describe('Protocol slug'),
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["dailyPremiumVolume", "dailyNotionalVolume", "totalPremiumVolume", "totalNotionalVolume"]).optional().describe('Desired data type, dailyNotionalVolume by default')
        },
        callback: async ({protocol, ...queryParams}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/summary/options/{protocol}", {
                params: {
                    path: {protocol},
                    query: queryParams
                }
            })
            return toResult(`${baseUrl}/summary/options/${protocol}`, data, error)
        }
    });

    // Fees endpoints
    registration.addTool({
        name: 'defilama-get-fees-overview',
        description: 'List all protocols along with summaries of their fees and revenue and dataType history data',
        args: {
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["totalFees", "dailyFees", "totalRevenue", "dailyRevenue"]).optional().describe('Desired data type, dailyFees by default')
        },
        callback: async (args) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/overview/fees", {
                params: {
                    query: args
                }
            })
            return toResult(`${baseUrl}/overview/fees`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-fees-overview-by-chain',
        description: 'List all protocols along with summaries of their fees and revenue and dataType history data by chain',
        args: {
            chain: z.string().describe('Chain name, list of all supported chains can be found under allChains attribute in /overview/fees response'),
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["totalFees", "dailyFees", "totalRevenue", "dailyRevenue"]).optional().describe('Desired data type, dailyFees by default')
        },
        callback: async ({chain, ...queryParams}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/overview/fees/{chain}", {
                params: {
                    path: {chain},
                    query: queryParams
                }
            })
            return toResult(`${baseUrl}/overview/fees/${chain}`, data, error)
        }
    });

    registration.addTool({
        name: 'defilama-get-fees-summary',
        description: 'Get summary of protocol fees and revenue with historical data',
        args: {
            protocol: z.string().describe('Protocol slug'),
            excludeTotalDataChart: z.boolean().optional().describe('True to exclude aggregated chart from response'),
            excludeTotalDataChartBreakdown: z.boolean().optional().describe('True to exclude broken down chart from response'),
            dataType: z.enum(["totalFees", "dailyFees", "totalRevenue", "dailyRevenue"]).optional().describe('Desired data type, dailyFees by default')
        },
        callback: async ({protocol, ...queryParams}) => {
            const baseUrl = registration.globalOptions.defilamaEndpoint;
            const client = createClient<paths>({baseUrl});
            const {
                data,
                error,
            } = await client.GET("/summary/fees/{protocol}", {
                params: {
                    path: {protocol},
                    query: queryParams
                }
            })
            return toResult(`${baseUrl}/summary/fees/${protocol}`, data, error)
        }
    });
}