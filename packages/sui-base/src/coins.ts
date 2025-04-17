import {CoinStruct, SuiClient} from "@mysten/sui/client";


export async function fetchCoins(client: SuiClient, account: string, coinType: string, cursor?: string | null): Promise<CoinStruct[]> {
    const { data, nextCursor, hasNextPage } = await client.getCoins({
        owner: account,
        coinType,
        cursor,
    });

    if (!hasNextPage) return data;

    const newData = await fetchCoins(client, account, coinType, nextCursor);

    return [...data, ...newData];
}