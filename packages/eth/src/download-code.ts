import fetch from "node-fetch";
import process from "process";
import {ChainId} from "@sentio/chain";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";

export type Code = { file: string, content: any };

export async function downloadCodes(baseDir: string, chain: ChainId, contractAddress: string) {

    let apiKey = process.env['ETHERSCAN_API_KEY_' + chain]
    if (!apiKey) {
        const keys: Record<string, string> = {
            [ChainId.ETHEREUM]: '1KQV22RY3KV1PX5IIB34TPAVVQG1ZMAU45',
            [ChainId.BASE]: 'K7613MC26RFMACK414RGZUEAX1184TWYZU'
        }
        apiKey = keys[chain]
    }
    let ethApi = 'https://api.etherscan.io'
    if (apiKey) {
        ethApi = `${ethApi}/api?apikey=${apiKey}&`
    } else {
        ethApi = `${ethApi}/api?`
    }

    const url = `${ethApi}module=contract&action=getsourcecode&address=${contractAddress}`;
    let resp = (await (await fetch(url)).json()) as any
    if (resp.status !== '1') {
        if (resp.result?.startsWith('Contract source code not verified')) {
            throw Error(resp.result + "(API can't retrieve ABI based on similar contract)")
        }
        throw Error(resp.message)
    }
    const result: Code[] = []
    for (const r of resp.result) {
        const code = r['SourceCode'].replaceAll("{{", "{").replaceAll("}}", "}")
        if (code) {
            const codes = JSON.parse(code)
            for (const [file, content]  of Object.entries(codes.sources)) {
                const filePath = path.join(baseDir, file)
                fs.mkdirSync(path.dirname(filePath), { recursive: true })
                const data = (content as any)['content']
                fs.writeFileSync(filePath, data)
                console.log(chalk.green('Downloaded file ', filePath))
                result.push({
                    file: filePath,
                    content: data
                })
            }
        }
    }
    return result
}
