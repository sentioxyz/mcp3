import * as dotenv from 'dotenv'
import {downloadABI} from "./abi.js"

import {defaultMoveCoder} from '@typemove/sui'
import {SuiClient, SuiMoveNormalizedFunction, SuiMoveNormalizedType} from "@mysten/sui/client";
import {Transaction} from '@mysten/sui/transactions'
import {normalizeSuiAddress} from "@mysten/sui/utils"
import {bcs, PureTypeName} from "@mysten/sui/bcs";

dotenv.config()

export interface ViewFunctionOptions {
    nodeUrl: string
    packageId: string
    module: string
    functionName: string
    params?: any[]
    typeArguments?: string[]
}


function formatTypeForPure(vectorType:  SuiMoveNormalizedType ): PureTypeName {
    switch (vectorType) {
        case 'U8':
            return 'u8'
        case 'U16':
            return 'u16'
        case 'U32':
            return 'u32'
        case 'U64':
            return 'u64'
        case 'U128':
            return 'u128'
        case 'U256':
            return 'u256'
        case 'Bool':
            return 'bool'
        case 'Address':
            return 'address'
        default:
            // handle vector types
            if (typeof vectorType === 'object' && vectorType !== null && 'Vector' in vectorType) {
                return `vector<${formatTypeForPure(vectorType.Vector)}>`
            }
            return 'u8'
    }
}

/**
 * Convert function parameters to transaction arguments
 * @param txb The transaction builder
 * @param fn The function definition
 * @param params The parameters to convert
 * @returns An array of transaction arguments
 */
function getArgs(txb: Transaction, fn: SuiMoveNormalizedFunction, params: any[]) {
    if (fn.parameters.length !== params.length) {
        throw new Error(`Expected ${fn.parameters.length} parameters, but got ${params.length}`)
    }

    return params.map((param, index) => {
        const paramType = fn.parameters[index]

        // Handle object references
        if (typeof param === 'string' && param.startsWith('0x')) {
            // Check if the parameter type is an object type
            if (typeof paramType === 'object') {
                if (('Reference' in paramType) ||
                    ('MutableReference' in paramType)) {
                    return txb.object(normalizeSuiAddress(param))
                }
                return txb.object(normalizeSuiAddress(param))
            }

            // For address type
            if (typeof paramType === 'string' && paramType.toLowerCase() === 'address') {
                return txb.pure.address(normalizeSuiAddress(param))
            }
        }

        // Handle primitive types
        if (typeof paramType === 'string') {
            const type = paramType.toLowerCase()
            switch (type) {
                case 'u8':
                    return txb.pure.u8(param)
                case 'u16':
                    return txb.pure.u16(param)
                case 'u32':
                    return txb.pure.u32(param)
                case 'u64':
                    return txb.pure.u64(param)
                case 'u128':
                    return txb.pure.u128(param)
                case 'u256':
                    return txb.pure.u256(param)
                case 'bool':
                    return txb.pure.bool(param)
                case 'address':
                    return txb.pure.address(param)
                default:
                    return txb.pure(param)
            }
        }

        // Handle vector types
        if (typeof paramType === 'object' && paramType !== null && 'Vector' in paramType) {
            if (Array.isArray(param)) {
                const vectorType = paramType.Vector as SuiMoveNormalizedType
                const innerType = formatTypeForPure(vectorType)
                return txb.pure.vector(innerType, param)
            }
        }

        // Default fallback
        return txb.pure(param)
    })
}

export async function callViewFunction(options: ViewFunctionOptions) {
    const {nodeUrl, packageId, module, functionName, params = [], typeArguments = []} = options

    const client = new SuiClient({url: nodeUrl})
    const coder = defaultMoveCoder(options.nodeUrl)

    try {
        const abi = await downloadABI(options.nodeUrl, packageId)

        const fn = abi[module]?.exposedFunctions[functionName]
        if (!fn) {
            throw new Error(`Function ${functionName} not found in module ${module}`)
        }

        // Create a new transaction block
        const txb = new Transaction()

        // Call the function
        txb.moveCall({
            typeArguments: typeArguments,
            target: `${packageId}::${module}::${functionName}`,
            arguments: getArgs(txb, fn, params)
        })
        txb.setSender("0x0000000000000000000000000000000000000000000000000000000000000000")
        txb.setGasBudget(10000000)

        // Build and sign the transaction
        // const builtTx = await txb.build({client})

        // Execute the transaction
        const result = await client.devInspectTransactionBlock({
            sender: packageId,
            transactionBlock: txb,
        })


        // Decode the return values if available
        if (result.results && result.results.length > 0 && result.results[0].returnValues) {
            const decodedResult = await coder.decodeDevInspectResult(result)
            return decodedResult.results_decoded
        }

        // If there are no return values, return null
        return null
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to call function: ${error.message}`)
        }
        throw new Error('Failed to call function: Unknown error')
    }
}
