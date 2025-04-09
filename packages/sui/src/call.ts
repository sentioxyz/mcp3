import {SuiClient, SuiMoveNormalizedFunction, SuiMoveNormalizedType,} from '@mysten/sui.js/client'
import {TransactionBlock} from '@mysten/sui.js/transactions'
import * as dotenv from 'dotenv'
import {downloadABI} from "./abi.js"
import {normalizeSuiAddress} from "@mysten/sui.js/utils"

dotenv.config()

export interface ViewFunctionOptions {
    nodeUrl: string
    packageId: string
    module: string
    functionName: string
    params?: any[]
    typeArguments?: string[]
}

/**
 * Convert parameters to the right type according to the ABI
 * @param txb TransactionBlock instance
 * @param fn Function definition from the ABI
 * @param params Array of parameter values provided by the user
 * @returns Array of converted parameters ready for moveCall
 */
function getArgs(txb: TransactionBlock, fn: SuiMoveNormalizedFunction, params: any[]) {
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
                    return txb.object(param)
                    // return txb.objectRef(txb.object(normalizeSuiAddress(param)))
                }
                return txb.object(normalizeSuiAddress(param))
            }

            // For address type
            if (typeof paramType === 'string' && paramType.toLowerCase() === 'address') {
                return txb.pure(normalizeSuiAddress(param), 'address')
            }
        }

        // Handle primitive types
        if (typeof paramType === 'string') {
            const type = paramType.toLowerCase()
            switch (type) {
                case 'u8':
                case 'u16':
                case 'u32':
                case 'u64':
                case 'u128':
                case 'u256':
                    return txb.pure(Number(param), type)
                case 'bool':
                    return txb.pure(Boolean(param), 'bool')
                case 'address':
                    return txb.pure(String(param), 'address')
                default:
                    return txb.pure(param)
            }
        }

        // Handle vector types
        if (typeof paramType === 'object' && paramType !== null && 'Vector' in paramType) {
            if (Array.isArray(param)) {
                const vectorType = paramType.Vector as SuiMoveNormalizedType
                return txb.pure(param, `vector<${formatTypeForPure(vectorType)}>`)
            }
        }

        // Handle option types
        if (typeof paramType === 'object' && paramType !== null && 'Option' in paramType) {
            const optionType = paramType.Option as SuiMoveNormalizedType
            const innerType = formatTypeForPure(optionType)
            if (param === null || param === undefined) {
                return txb.pure(null, `option<${innerType}>`)
            } else {
                return txb.pure(param, `option<${innerType}>`)
            }
        }

        // Default fallback
        return txb.pure(param)
    })
}

/**
 * Format a type for use with txb.pure
 * @param type The type to format
 * @returns A string representation of the type
 */
function formatTypeForPure(type: SuiMoveNormalizedType): string {
    if (typeof type === 'string') {
        return type.toLowerCase()
    }

    if (typeof type === 'object' && type !== null) {
        if ('Vector' in type) {
            const vectorType = type.Vector as SuiMoveNormalizedType
            return `vector<${formatTypeForPure(vectorType)}>`
        }
        if ('Option' in type) {
            const optionType = type.Option as SuiMoveNormalizedType
            return `option<${formatTypeForPure(optionType)}>`
        }
        if ('Struct' in type) {
            return `${type.Struct.address}::${type.Struct.module}::${type.Struct.name}`
        }
        if ('Reference' in type) {
            const refType = type.Reference as SuiMoveNormalizedType
            return `&${formatTypeForPure(refType)}`
        }
        if ('MutableReference' in type) {
            const mutRefType = type.MutableReference as SuiMoveNormalizedType
            return `&mut ${formatTypeForPure(mutRefType)}`
        }
    }

    return String(type)
}

/**
 * Decode a return value based on the ABI type
 * @param value The raw return value
 * @param type The ABI type
 * @returns The decoded value
 */
function decodeReturnValue(value: any, type: SuiMoveNormalizedType): any {
    // If value is null or undefined, return it as is
    if (value === null || value === undefined) {
        return value;
    }

    // Handle primitive types
    if (typeof type === 'string') {
        const typeStr = type.toLowerCase();
        if (typeStr.startsWith('u') && !isNaN(Number(typeStr.substring(1)))) {
            // Handle unsigned integers (u8, u16, u32, u64, u128, u256)
            if (Array.isArray(value)) {
                // For u64, u128, u256 that come as byte arrays
                if (typeStr === 'u64') {
                    // Little-endian byte array to number
                    let result = 0n;
                    for (let i = 0; i < value.length; i++) {
                        result += BigInt(value[i]) << BigInt(8 * i);
                    }
                    // Convert to string to avoid serialization issues
                    return result.toString();
                } else if (typeStr === 'u128' || typeStr === 'u256') {
                    // For larger integers, use the same approach
                    let result = 0n;
                    for (let i = 0; i < value.length; i++) {
                        result += BigInt(value[i]) << BigInt(8 * i);
                    }
                    return result.toString();
                } else {
                    // For smaller integers that shouldn't be arrays
                    return Number(value.join(''));
                }
            }
            return Number(value);
        }
        if (typeStr === 'bool') {
            return Boolean(value);
        }
        if (typeStr === 'address') {
            return String(value);
        }
        // For other primitive types, return as is
        return value;
    }

    // Handle complex types
    if (typeof type === 'object' && type !== null) {
        // Handle vector types
        if ('Vector' in type && Array.isArray(value)) {
            const vectorType = type.Vector as SuiMoveNormalizedType;
            return value.map(item => decodeReturnValue(item, vectorType));
        }

        // Handle option types
        if ('Option' in type) {
            if (value === null || value === undefined) {
                return null;
            }
            const optionType = type.Option as SuiMoveNormalizedType;
            return decodeReturnValue(value, optionType);
        }

        // Handle struct types
        if ('Struct' in type && typeof value === 'object') {
            const result: Record<string, any> = {};
            // This is a simplified approach - in a real implementation,
            // you would need to match the struct fields with the values
            for (const key in value) {
                result[key] = value[key]; // Ideally, decode each field based on its type
            }
            return result;
        }

        // Handle reference types
        if ('Reference' in type) {
            const refType = type.Reference as SuiMoveNormalizedType;
            return decodeReturnValue(value, refType);
        }

        if ('MutableReference' in type) {
            const mutRefType = type.MutableReference as SuiMoveNormalizedType;
            return decodeReturnValue(value, mutRefType);
        }
    }

    // Default fallback
    return value;
}

export async function callViewFunction(options: ViewFunctionOptions) {
    const {nodeUrl, packageId, module, functionName, params = [], typeArguments= []} = options

    const client = new SuiClient({url: nodeUrl})

    try {
        const abi = await downloadABI(options.nodeUrl, packageId)

        const fn = abi[module]?.exposedFunctions[functionName]
        if (!fn) {
            throw new Error(`Function ${functionName} not found in module ${module}`)
        }

        // Create a new transaction block
        const txb = new TransactionBlock()

        // Call the function
        txb.moveCall({
            typeArguments: typeArguments,
            target: `${packageId}::${module}::${functionName}`,
            arguments: getArgs(txb, fn, params),
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
            // Extract only the decoded values
            const decodedValues = result.results[0].returnValues.map((returnValue, index) => {
                const returnType = fn.return[index];
                if (!returnType) {
                    return returnValue;
                }
                return decodeReturnValue(returnValue[0], returnType);
            });

            // If there's only one return value, return it directly
            // Otherwise, return the array of decoded values
            return decodedValues.length === 1 ? decodedValues[0] : decodedValues;
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
