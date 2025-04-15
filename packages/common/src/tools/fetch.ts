import { z } from 'zod';

import nodeFetch, {RequestInit, Response} from 'node-fetch';
import {Registration} from "../system.js";

/**
 * HTTP methods supported by the fetch utility
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT';

/**
 * Options for the fetch function
 */
export interface FetchOptions {
    /**
     * The URL to fetch from
     */
    url: string;

    /**
     * The HTTP method to use (GET, POST, PUT)
     */
    method: HttpMethod;

    /**
     * Optional headers to include in the request
     */
    headers?: Record<string, string>;

    /**
     * Optional body to include in the request (for POST and PUT)
     * Will be automatically converted to JSON if not a string
     */
    body?: any;

    /**
     * Optional timeout in milliseconds
     * Default: 30000 (30 seconds)
     */
    timeout?: number;
}

/**
 * Schema for validating FetchOptions
 */
const fetchOptionsSchema = z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT']),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
    timeout: z.number().positive().optional().default(30000)
});

/**
 * Error class for HTTP request failures
 */
export class HttpError extends Error {
    status: number;
    statusText: string;
    response: Response;

    constructor(response: Response, message?: string) {
        super(message || `HTTP Error: ${response.status} ${response.statusText}`);
        this.name = 'HttpError';
        this.status = response.status;
        this.statusText = response.statusText;
        this.response = response;
    }
}

/**
 * Response object returned by the fetch function
 */
export interface FetchResponse<T> {
    /**
     * The parsed response data
     */
    data: T;

    /**
     * The content type of the response
     */
    contentType: string;
}

/**
 * Fetches data from a URL using the specified HTTP method
 *
 * @param options - The options for the fetch request
 * @returns An object containing the parsed response data and content type
 * @throws {HttpError} If the response status is not ok
 * @throws {Error} If there's an error parsing the response
 */
export async function httpFetch<T = any>(options: FetchOptions): Promise<FetchResponse<T>> {
    // Validate options
    const validatedOptions = fetchOptionsSchema.parse(options);

    const {url, method, headers = {}, body, timeout} = validatedOptions;

    // Prepare fetch options
    const fetchOptions: RequestInit = {
        method,
        headers: {
            ...headers
        }
    };

    // Set appropriate headers for request
    fetchOptions.headers = {
        'Accept': 'application/json, text/plain, application/octet-stream, */*',
        ...fetchOptions.headers
    };

    // Add body for POST and PUT requests
    if ((method === 'POST' || method === 'PUT') && body !== undefined) {
        // Check if body is already a string
        if (typeof body === 'string') {
            fetchOptions.body = body;
            // If Content-Type is not already set, default to text/plain for string bodies
            if (!fetchOptions.headers['Content-Type']) {
                fetchOptions.headers['Content-Type'] = 'text/plain';
            }
        } else {
            // Default to JSON stringify for objects
            fetchOptions.body = JSON.stringify(body);
            fetchOptions.headers['Content-Type'] = 'application/json';
        }
    }

    // Make the request with a timeout promise race
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout);
    });

    try {
        // Race between the fetch and the timeout
        const response = await Promise.race([
            nodeFetch(url, fetchOptions),
            timeoutPromise
        ]) as Response;

        // Check if the response is ok
        if (!response.ok) {
            throw new HttpError(response);
        }

        // Parse and return the response based on Content-Type header
        try {
            const contentType = response.headers.get('content-type') || '';
            let data: T;

            if (contentType.includes('application/json')) {
                data = await response.json() as T;
            } else if (contentType.includes('application/octet-stream') ||
                contentType.includes('image/') ||
                contentType.includes('audio/') ||
                contentType.includes('video/') ||
                contentType.includes('application/pdf') ||
                contentType.includes('application/zip')) {
                // Handle binary data
                const buffer = await response.arrayBuffer();
                data = buffer as unknown as T;
            } else {
                // Default to text for everything else
                data = await response.text() as unknown as T;
            }

            return {
                data,
                contentType
            };
        } catch (error) {
            const contentType = response.headers.get('content-type') || 'unknown';
            throw new Error(`Failed to parse response with content-type '${contentType}': ${error instanceof Error ? error.message : String(error)}`);
        }
    } catch (error) {
        // Re-throw the error
        throw error;
    }
}


export function registerFetchTool(reg: Registration): void {
    reg.addTool(
        {
            name: 'fetch',
            description: 'Make HTTP requests and return responses (automatically handles JSON, text, and binary data based on content-type)',
            args: {
                url: z.string().url().describe('The URL to fetch from'),
                method: z.enum(['GET', 'POST', 'PUT']).default('GET').describe('The HTTP method to use'),
                headers: z.record(z.string()).optional().describe('Optional headers to include in the request'),
                body: z.any().optional().describe('Optional body to include in the request (for POST and PUT)'),
                timeout: z.number().positive().optional().default(30000).describe('Optional timeout in milliseconds')
            },
            callback: async (params, _) => {
                try {
                    const response = await httpFetch({
                        url: params.url,
                        method: params.method as HttpMethod,
                        headers: params.headers,
                        body: params.body,
                        timeout: params.timeout
                    });

                    // Format the response based on the content type
                    const isJson = response.contentType.includes('application/json');
                    const isBinary = response.contentType.includes('application/octet-stream') ||
                        response.contentType.includes('image/') ||
                        response.contentType.includes('audio/') ||
                        response.contentType.includes('video/') ||
                        response.contentType.includes('application/pdf') ||
                        response.contentType.includes('application/zip');

                    if (isJson) {
                        // Return JSON as formatted text
                        return {
                            content: [{
                                type: 'text',
                                text: JSON.stringify(response.data, null, 2)
                            }],
                            metadata: {
                                contentType: response.contentType
                            }
                        };
                    } else if (isBinary) {
                        // Return binary data as a resource
                        // Generate a unique resource URI based on URL and timestamp
                        const resourceUri = `fetch://${encodeURIComponent(params.url)}?t=${Date.now()}`;

                        // Convert ArrayBuffer to base64 string
                        const base64Data = Buffer.from(response.data).toString('base64');

                        return {
                            content: [{
                                type: 'resource',
                                resource: {
                                    uri: resourceUri,
                                    mimeType: response.contentType,
                                    // Use blob format for binary data as required by MCP
                                    blob: base64Data
                                }
                            }],
                            metadata: {
                                contentType: response.contentType
                            }
                        };
                    } else {
                        // Return text as is
                        return {
                            content: [{
                                type: 'text',
                                text: response.data as string
                            }],
                            metadata: {
                                contentType: response.contentType
                            }
                        };
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify({error: errorMessage}, null, 2)
                        }],
                        metadata: {
                            error: true
                        }
                    };
                }
            }

        }
    );
}
