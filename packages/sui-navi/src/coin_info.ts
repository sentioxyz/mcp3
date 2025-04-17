import {CoinInfo, AddressMap} from "navi-sdk";


export function getCoinInfo(coinSymbolOrAddress: string): Omit<CoinInfo, 'decimal'> | undefined {
    let symbol: string
    let address: string
    if (coinSymbolOrAddress.startsWith('0x')) {
        symbol = AddressMap[coinSymbolOrAddress];
        if (!symbol) {
            return undefined;
        }
        address = coinSymbolOrAddress;
        return {
            symbol,
            address,
        }
    }
    // find by address by map values
    else {
        for (const [k, v] of Object.entries(AddressMap)) {
            if (v.toLowerCase() === coinSymbolOrAddress.toLowerCase()) {
                symbol = v;
                address = k;
                return {
                    symbol,
                    address,
                }
            }
        }
    }
    return undefined
}