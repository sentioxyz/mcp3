import {Registration} from '@mcp3/common';
import {defaultProtocolPackage, AddressMap, getConfig} from "navi-sdk"

export function registerNaviResource(registration: Registration) {
    registration.addResource({
        name: "navi",
        uri: "sui:///projects/navi",
        callback: async (uri) => {
            const config = await getConfig()

            return {
                contents: [
                    {
                        uri: uri.toString(),
                        mimeType: "text/plain",
                        text: `
## Important Addresses

### Navi Protocol Package
- Package ID: '${defaultProtocolPackage}' }

### Config
\`\`\`
${JSON.stringify(config)}
\`\`\`

## Common Coin Addresses
\`\`\`
${JSON.stringify(AddressMap)}
\`\`\`

## Additional Resources
- Navi Protocol Documentation: https://naviprotocol.gitbook.io/navi-protocol-docs/
- Navi SDK GitHub: https://github.com/naviprotocol/navi-sdk
`
                    },
                ]
            };
        }
    });
}
