import {ethers} from "ethers";
import {ChainId} from "@sentio/chain";


export async function invokeEthCall(
    jsonRpcEndpoint: string ,
    contractAddress: string,
    contractAbi: any,
    cmd: string,
    block = 0
): Promise<any> {
    const provider = new ethers.JsonRpcProvider(jsonRpcEndpoint)

    const contract = new ethers.Contract(
        contractAddress,
        contractAbi,
        provider
    ) as any
    const {functionName, args} = parseCommand(contractAbi, cmd)

    let result;
    if (block > 0) {
        result = await contract[functionName](...args, {blockTag: block})
    } else {
        result = await contract[functionName](...args)
    }
    return result
}


interface Function {
    name: string;
    inputs: any[];
    outputs: any[];
    stateMutability: string;
}

function parseCommand(contractAbi: any, cmd: string) {
    const regex = /(\w+)\((.*)\)/;
    const match = cmd.match(regex);
    if (!match) {
        throw new Error(`Invalid command format: ${cmd}`);
    }
    const functionName = match[1];
    const argsString = match[2];
    const args = argsString.split(',').map((arg: string) => arg.trim()).filter(a => a.length > 0);
    const functions = getFunctionsFromContract(contractAbi);
    const func = functions.find((f: Function) => f.name === functionName);
    if (!func) {
        throw new Error(`Function ${functionName} not found in contract ABI`);
    }
    const inputs = func.inputs.map((input: any) => input.type);
    // convert args from string to appropriate type according to abi inputs
    const convertedArgs = args.map((arg: string, index: number) => {
        const type = inputs[index];
        if (type.startsWith('uint')) {
            return BigInt(arg);
        } else if (type === 'address') {
            return ethers.getAddress(arg);
        } else if (type === 'string') {
            return arg;
        } else if (type === 'bool') {
            return arg.toLowerCase() === 'true';
        } else if (type.startsWith('bytes')) {
            return arg.toLowerCase()
        }
        // Add more types as needed
        return arg;
    });

    return {functionName, args: convertedArgs};
}

export function getFunctionsFromContract(abi: any): Function[] {
    return abi.filter((item: any) => item.type === 'function')
}

export function getProviderEndpoint(chain: ChainId) : string {
    const endpoint = process.env[`RPC_ENDPOINT_${chain}`]
    if (endpoint) {
        return endpoint
    }
    switch (chain) {
        case ChainId.ETHEREUM:
            return "https://rpc.ankr.com/eth"
        case ChainId.BASE:
            return "https://base-mainnet.public.blastapi.io"
        case ChainId.MANTLE:
            return "https://rpc.mantlenetwork.io/"
        default:
            throw new Error(`Unsupported chain: ${chain}`)
    }
}