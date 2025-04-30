
import {createClient} from "@hey-api/client-fetch";
import {WebService} from "@sentio/api";


 export class SentioClient {

    constructor(readonly endpoint: string, readonly apiKey: string) {
    }

    get client() {
        const client = createClient({baseUrl: this.endpoint});
        client.interceptors.request.use((config) => {
            if (this.apiKey) {
                config.headers.set("api-key", `${this.apiKey}`);
            }
            return config;
        })
        return client;
    }

    async getProject(owner: string, slug: string) {
        const p = await WebService.getProject({
            path: {
                owner,
                slug
            }
        });
        return p.data?.project
    }

    async getEndpointList(projectId) {

    }

 }
 
export function toResult(url: string, data: any, error: any) {
    if (error) {
        return {
            content: [{
                type: 'text',
                text: `Failed to query ${url}: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
        };
    }
    
    return {
        content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
        }]
    };
}