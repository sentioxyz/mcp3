import {downloadABI} from "./abi.js"

import {defaultMoveCoder} from '@typemove/sui'
import {SuiClient, SuiMoveNormalizedFunction, SuiMoveNormalizedType} from "@mysten/sui/client";
import {Transaction} from '@mysten/sui/transactions'
import {normalizeSuiAddress} from "@mysten/sui/utils"

export interface ViewFunctionOptions {
    nodeUrl: string
    packageId: string
    module: string
    functionName: string
    params?: any[]
    typeArguments?: string[]
}

function getArgs(txb: Transaction, fn: SuiMoveNormalizedFunction, params: any[]) {
    if (!fn.parameters || fn.parameters.length === 0) {
        return []
    }

    // Skip the first parameter if it's &mut TxContext or &TxContext
    const skipFirst = fn.parameters[0].toString().includes('TxContext')
    const startIdx = skipFirst ? 1 : 0
    const expectedParamCount = fn.parameters.length - startIdx

    if (params.length !== expectedParamCount) {
        throw new Error(`Expected ${expectedParamCount} parameters, got ${params.length}`)
    }

    return params.map((param, i) => {
        const paramType = fn.parameters[i + startIdx]

        // Handle different parameter types
        if (typeof param === 'string' && paramType.toString().includes('address')) {
            return txb.pure.address(normalizeSuiAddress(param))
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

        // Execute the transaction
        const result = await client.devInspectTransactionBlock({
            sender: packageId,
            transactionBlock: txb,
        })

        if (result.effects.status.status !== "success") {
            throw new Error(`Transaction failed: ${JSON.stringify(result.effects.status)}`)
        }

        // Parse the return values
        if (!result.results || result.results.length === 0) {
            return null
        }

        // Return the decoded values
        return result.results[0].returnValues
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to call view function: ${error.message}`)
        }
        throw new Error('Failed to call view function: Unknown error')
    }
}
