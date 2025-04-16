import {SuiClient} from '@mysten/sui/client'

/**
 * Download ABI for a Sui package
 * @param nodeUrl The Sui RPC URL
 * @param objectId The object ID to get the ABI for
 * @returns The normalized Move modules
 */
export async function downloadABI(nodeUrl: string, objectId: string) {
    const client = new SuiClient({ url: nodeUrl });
    const object = await client.getObject({
        id: objectId,
        options:{
            showType: true,
            showContent: true,
        }
    });

    if (!object.data) {
        throw new Error('Object not found');
    }

    if (!object.data.content) {
        throw new Error('Object content not available');
    }

    return await client.getNormalizedMoveModulesByPackage({
        package: objectId
    });
}
