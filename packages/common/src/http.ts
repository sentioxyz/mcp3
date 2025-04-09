import fetch, { RequestInit, Response } from 'node-fetch';
import { z } from 'zod';

/**
 * HTTP methods supported by the fetchJSON utility
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT';

/**
 * Options for the fetchJSON function
 */
export interface FetchJSONOptions {
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
   * Will be automatically converted to JSON
   */
  body?: any;

  /**
   * Optional timeout in milliseconds
   * Default: 30000 (30 seconds)
   */
  timeout?: number;
}

/**
 * Schema for validating FetchJSONOptions
 */
const fetchJSONOptionsSchema = z.object({
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
 * Fetches JSON data from a URL using the specified HTTP method
 *
 * @param options - The options for the fetch request
 * @returns The parsed JSON response
 * @throws {HttpError} If the response status is not ok
 * @throws {Error} If there's an error parsing the JSON response
 */
export async function fetchJSON<T = any>(options: FetchJSONOptions): Promise<T> {
  // Validate options
  const validatedOptions = fetchJSONOptionsSchema.parse(options);

  const { url, method, headers = {}, body, timeout } = validatedOptions;

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    }
  };

  // Add body for POST and PUT requests
  if ((method === 'POST' || method === 'PUT') && body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Make the request with a timeout promise race
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout);
  });

  try {
    // Race between the fetch and the timeout
    const response = await Promise.race([
      fetch(url, fetchOptions),
      timeoutPromise
    ]) as Response;

    // Check if the response is ok
    if (!response.ok) {
      throw new HttpError(response);
    }

    // Parse and return the JSON response
    try {
      return await response.json() as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    // Re-throw the error
    throw error;
  }
}
