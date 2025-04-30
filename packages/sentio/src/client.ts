import {createClient} from "@hey-api/client-fetch";
import {WebService} from "@sentio/api";

/**
 * Interface for Sentio endpoint
 */
export interface SentioEndpoint {
    id: string;
    name: string;
    slug: string;
    owner: string;
    projectId: string;
    projectSlug: string
    enabled: boolean
}

/**
 * Interface for Sentio endpoint parameter in docs
 */
export interface SentioEndpointDocParameter {
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue: any;
}

/**
 * Interface for Sentio endpoint documentation
 */
export interface SentioEndpointDocs {
    endpointUrl: string;
    pathParameters: SentioEndpointDocParameter[];
    bodyParameters: SentioEndpointDocParameter[];
    queryParameters: SentioEndpointDocParameter[];
    method: string;
}

/**
 * Sentio API client
 */
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

    /**
     * Get a project by owner and slug
     * @param owner The project owner
     * @param slug The project slug
     * @returns The project data
     */
    async getProject(owner: string, slug: string) {
        const p = await WebService.getProject({
            path: {
                owner,
                slug
            },
            client: this.client
        });
        return p.data?.project
    }

    /**
     * Get the list of endpoints for a project
     * @param projectId The project ID
     * @returns The list of endpoints
     */
    async getEndpointList(projectId: string): Promise<SentioEndpoint[]> {
        try {
            const response = await this.client.get({
                url: "/api/v1/endpoint/{projectId}/endpoints",
                path: {
                    projectId
                }
            })
            return (response.data as any)['endpoints'] as SentioEndpoint[];
        } catch (error) {
            console.error(`Failed to get endpoints for project ${projectId}:`, error);
            return [];
        }
    }

    /**
     * Get documentation for an endpoint
     * @param endpointId The endpoint ID
     * @returns The endpoint documentation
     */
    async getEndpointDocs(endpointId: string): Promise<SentioEndpointDocs | null> {
        try {
            const response = await this.client.get({
                url: "/api/v1/endpoint/{endpointId}/docs",
                path: {
                    endpointId
                }
            });
            return response.data as SentioEndpointDocs;
        } catch (error) {
            console.error(`Failed to get docs for endpoint ${endpointId}:`, error);
            return null;
        }
    }

    /**
     * Call an endpoint
     * @param url
     * @param params The parameters to pass to the endpoint
     * @returns The endpoint response
     */
    async callEndpoint(url: string, params: Record<string, any> = {}) {
        try {
            // Make the request
            const response = await this.client.post({
                url,
                body: params
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to call endpoint ${url}: ${error instanceof Error ? error.message : String(error)}`);
        }
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