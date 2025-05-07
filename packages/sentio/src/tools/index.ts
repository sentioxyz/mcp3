import { Registration } from "@mcp3/common";
import { z } from 'zod';
import { SentioClient, SentioEndpoint, SentioEndpointDocParameter, SentioEndpointDocs, toResult } from '../client.js';
import {CommonProject} from "@sentio/api";


/**
 * Register all Sentio tools with the Registration
 * @param registration The Registration instance
 */
export async function registerTools(registration: Registration) {

    const client = new SentioClient(registration.globalOptions.sentioEndpoint, registration.globalOptions.sentioApiKey);
    await registerEndpoints(registration, client);
    await registerSQL(registration, client);
}

/**
 * Convert a Sentio parameter type to a Zod schema
 * @param param The Sentio parameter
 * @returns The Zod schema
 */
function paramToZodSchema(param: SentioEndpointDocParameter) {
    let schema: any;

    // Convert Sentio parameter type to Zod schema
    switch (param.type.toUpperCase()) {
        case 'STRING':
            schema = z.string();
            break;
        case 'NUMBER':
        case 'INTEGER':
            schema = z.number();
            break;
        case 'BOOL':
        case 'BOOLEAN':
            schema = z.boolean();
            break;
        case 'ARRAY':
            schema = z.array(z.any());
            break;
        case 'OBJECT':
            schema = z.record(z.any());
            break;
        default:
            schema = z.any();
    }

    // Add description if available
    if (param.description) {
        schema = schema.describe(param.description);
    }

    // Make optional if not required
    if (!param.required) {
        schema = schema.optional();
        if (param.defaultValue == null) {
            schema = schema.optional();
        } else {
            schema = schema.default(param.defaultValue);
        }
    }

    return schema;
}

async function registerEndpoints(registration: Registration, client: SentioClient) {
    // Register all endpoints as MCP tools
    const projects = (registration.globalOptions.sentioProjects ?? "").split(",");
    for (const project of projects) {
        if (!project) {
            continue
        }
        let projectId = '';
        let projectName = project;
        let p: CommonProject | undefined = undefined;
        if (project.indexOf('/') === -1) {
            // Use project as ID
            projectId = project;
        } else {
            const [owner, slug] = project.split('/');
            projectName = owner + "-" + slug;

            // Call Sentio API to get project ID
            p = await client.getProject(owner, slug);
            if (!p?.id) {
                console.error(`Failed to find project ${project}`);
                continue;
            }
            projectId = p.id;
        }

        // Get all endpoints for this project
        const endpoints = await client.getEndpointList(projectId);

        // Register each endpoint as a tool
        for (const endpoint of endpoints) {
            if (!endpoint.enabled) {
                continue;
            }

            // Get endpoint documentation
            const docs = await client.getEndpointDocs(endpoint.id);
            if (!docs) {
                console.error(`Failed to get docs for endpoint ${endpoint.id}`);
                continue;
            }

            // Create a sanitized name for the tool
            const toolName = `${projectName}-${endpoint.name.toLowerCase().replace(/\s+/g, '-')}`;

            // Create Zod schema for endpoint parameters
            const args: Record<string, any> = {};

            // Add body parameters
            if (docs.bodyParameters && docs.bodyParameters.length > 0) {
                for (const param of docs.bodyParameters) {
                    args[param.name] = paramToZodSchema(param);
                }
            }

            // Add query parameters
            if (docs.queryParameters && docs.queryParameters.length > 0) {
                for (const param of docs.queryParameters) {
                    args[param.name] = paramToZodSchema(param);
                }
            }

            // Add path parameters
            if (docs.pathParameters && docs.pathParameters.length > 0) {
                for (const param of docs.pathParameters) {
                    args[param.name] = paramToZodSchema(param);
                }
            }

            // Register the tool
            registration.addTool({
                name: toolName,
                description: `Call the ${endpoint.name} endpoint for Sentio project ${projectName} (${p?.description})`,
                args,
                callback: async (params) => {
                    try {
                        const result = await client.callEndpoint(`https://endpoint.sentio.xyz/${endpoint.owner}/${endpoint.projectSlug}/${endpoint.slug}`, params) as any;
                        return {
                            content: [{
                                type: 'text',
                                text: JSON.stringify(result?.syncSqlResponse?.result, null, 2)
                            }]
                        };
                    } catch (error) {
                        return {
                            content: [{
                                type: 'text',
                                text: `Failed to call endpoint ${endpoint.name}: ${error instanceof Error ? error.message : String(error)}`
                            }],
                            isError: true
                        };
                    }
                }
            });
        }
    }
}


async function registerSQL(registration: Registration, client: SentioClient) {
    // add a tools the retrieve project tables
    const projects = (registration.globalOptions.sentioProjects ?? "").split(",");
    registration.addTool({
        name: "sentio-get-tables",
        description: "Get all tables for a Sentio project",
        args: {
            project: z.enum(projects).describe("The project name in format of owner/slug")
        },
        callback: async ({project}) => {
            try {
                const tables = await client.getTables(project);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(tables, null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get tables: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        }
    })

    registration.addTool({
        name: "sentio-execute-sql",
        description: "Execute a SQL query on a Sentio project",
        args: {
            project: z.enum(projects).describe("The project name in format of owner/slug"),
            sql: z.string().describe("The SQL query to execute"),
            limit: z.number().optional().describe("The maximum number of rows to return").default(100),
        },
        callback: async ({project, sql, limit}) => {
            try {
                const result = await client.executeSQL(project, sql, limit);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to execute SQL: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        }
    })
}

