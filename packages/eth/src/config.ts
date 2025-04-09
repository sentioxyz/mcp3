import yaml from "yaml";

import fs from "fs";
import {globSync} from "glob";

export interface YamlConfig {
    name?: string
    address: string
    chain: string
    functions?: AbiFunction[]
}

export interface AbiFunction {
    name: string
    description: string
}


export function writeConfig(config: YamlConfig, filePath: string) {
    const yamlString = yaml.stringify(config)
    fs.writeFileSync(filePath, yamlString, 'utf8')
}


export function readConfig(configFile: string) {
    const fileContent = fs.readFileSync(configFile, 'utf8')
    const config = yaml.parse(fileContent) as YamlConfig
    if (!config.address || !config.chain) {
        throw new Error(`Invalid config file: ${configFile}`)
    }
    return config
}

export function listConfigs(dir: string): Record<string, YamlConfig> {
    const configFiles = globSync(`${dir}/**/config.yaml`)
    const configs: Record<string, YamlConfig> = {}
    for (const configFile of configFiles) {
        try {
            configs[configFile] = readConfig(configFile)
        } catch (e) {
            console.error(`Error reading config file ${configFile}:`, e)
        }
    }
    return configs
}

export function findConfigByAddress(address: string, dir: string): YamlConfig & { configFile: string } | undefined {
    const configFiles = globSync(`${dir}/**/config.yaml`)
    for (const configFile of configFiles) {
        try {
            const config = readConfig(configFile)
            if (isAddressEqual(config.address, address)) {
                return {...config, configFile}
            }
        } catch (e) {
            console.error(`Error reading config file ${configFile}:`, e)
        }
    }
    return undefined
}

function isAddressEqual(a: string, b: string): boolean {
    // compare two address by parsing to byte array and compare
    const aBytes = Buffer.from(a.startsWith("0x") ? a.slice(2) : a, 'hex')
    const bBytes = Buffer.from(b.startsWith("0x") ? b.slice(2) : b, 'hex')
    if (aBytes.length !== bBytes.length) {
        return false
    }
    for (let i = 0; i < aBytes.length; i++) {
        if (aBytes[i] !== bBytes[i]) {
            return false
        }
    }
    return true
}