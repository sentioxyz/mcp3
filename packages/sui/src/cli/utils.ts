import chalk from 'chalk';
import { SuiMoveNormalizedType } from '@mysten/sui.js/client';
import { normalizeSuiAddress } from "@mysten/sui.js/utils";

/**
 * Format an address for display, optionally showing the full address
 * @param address The address to format
 * @param longAddress Whether to show the full address
 * @returns The formatted address
 */
export function formatAddress(address: string, longAddress: boolean): string {
    if (longAddress) {
        return address;
    }
    if (address.length < 10) {
        return address;
    }
    // Shorten address to first 6 and last 4 characters
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a type argument with its constraints
 * @param typeParam The type parameter object
 * @param index The index of the type parameter
 * @returns Formatted string representation of the type parameter
 */
export function formatTypeArgument(typeParam: any, index: number): string {
    let abilities = '';
    // Check if abilities exists and has the expected structure
    if (typeParam.abilities && Array.isArray(typeParam.abilities)) {
        abilities = typeParam.abilities.join(', ');
    } else if (typeParam.abilities && typeParam.abilities.abilities && Array.isArray(typeParam.abilities.abilities)) {
        abilities = typeParam.abilities.abilities.join(', ');
    }

    return abilities.length > 0 ?
        `${chalk.magenta('T')}${chalk.magenta(index)}: ${chalk.green(abilities)}` :
        `${chalk.magenta('T')}${chalk.magenta(index)}`;
}

/**
 * Format a Sui type for display
 * @param param The type to format
 * @param longAddress Whether to show full addresses
 * @returns The formatted type string
 */
export function formatSuiType(param: SuiMoveNormalizedType, longAddress: boolean = false): string {
    if (typeof param === 'object' && param !== null) {
        if ('Struct' in param) {
            const typeArgs = param.Struct.typeArguments
                .map((typeArg) => formatSuiType(typeArg, longAddress))
                .join(', ');
            let ret = typeArgs ? `${chalk.blue(formatAddress(param.Struct.address, longAddress))}::${chalk.yellow(param.Struct.module)}::${chalk.green(param.Struct.name)}` : `${chalk.blue(formatAddress(param.Struct.address, longAddress))}::${chalk.yellow(param.Struct.module)}::${chalk.green(param.Struct.name)}`;
            if (typeArgs.length > 0) {
                ret += chalk.gray(`<${typeArgs}>`)
            }
            return ret
        }
        if ('Vector' in param) {
            return `${chalk.magenta('vector')}<${formatSuiType(param.Vector, longAddress)}>`;
        }
        if ('TypeParameter' in param) {
            // Use a simplified version for type parameters in type contexts
            return `${chalk.magenta('T')}${chalk.magenta(param.TypeParameter)}`;
        }
        if ('Reference' in param) {
            return `${chalk.gray('&')}${formatSuiType(param.Reference, longAddress)}`;
        }
        if ('MutableReference' in param) {
            return `${chalk.gray('&mut')} ${formatSuiType(param.MutableReference, longAddress)}`;
        }
    }

    // Handle primitive types
    return chalk.yellow(String(param));
}

/**
 * Parse a function argument
 * @param arg The argument string
 * @returns The parsed argument
 */
export function parseArg(arg: string) {
    try {
        return JSON.parse(arg)
    } catch (e) {
        if (arg.startsWith("0x")) {
            return normalizeSuiAddress(arg)
        }
        return arg
    }
}

/**
 * Parse a function call string into function name, parameters, and type arguments
 * @param fn The function call string (e.g., "functionName(arg1,arg2)" or "functionName<T0,T1>(arg1,arg2)")
 * @returns A tuple of [functionName, params, typeArguments]
 */
export function parseFn(fn: string): [string, any[], string[]] {
    // Match function name, type arguments, and parameters
    // Example: functionName<T0,T1>(arg1,arg2)
    const match = fn.match(/^(\w+)(?:<([^>]*)>)?\((.*)\)$/);
    if (!match) {
        throw new Error('Invalid function format. Expected: functionName(arg1,arg2) or functionName<T0,T1>(arg1,arg2)');
    }

    const [, functionName, typeArgsStr, argsStr] = match;

    // Parse parameters
    const params = argsStr ? argsStr.split(',').map(parseArg) : [];

    // Parse type arguments
    const typeArguments = typeArgsStr ? typeArgsStr.split(',').map(arg => arg.trim()) : [];

    return [functionName, params, typeArguments];
}
