import {
    McpServer,
    ToolCallback,
    ReadResourceCallback,
    ResourceMetadata,
    ResourceTemplate,
    ReadResourceTemplateCallback,

} from "@modelcontextprotocol/sdk/server/mcp.js";
import {Command} from 'commander';
import {z, ZodRawShape, ZodTypeAny, ZodArray} from "zod";
import {CallToolResult} from "@modelcontextprotocol/sdk/types.js";
import {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol.js";


type CommandFn = (command: Command) => void;

interface ToolWithArgs<Args extends ZodRawShape> {
    name: string,
    description: string,
    args: Args
    callback: (args: z.objectOutputType<Args, ZodTypeAny>, extra: RequestHandlerExtra) => CallToolResult | Promise<CallToolResult>
}

interface ToolWithoutArgs {
    name: string,
    description: string,
    callback: (extra: RequestHandlerExtra) => CallToolResult | Promise<CallToolResult>;
}

type Tool<Args extends undefined | ZodRawShape> = Args extends ZodRawShape ? ToolWithArgs<Args> : ToolWithoutArgs;

type Resource = { name: string, uri: string, metadata?: ResourceMetadata, callback: ReadResourceCallback };
type TemplateResource = {
    name: string,
    template: ResourceTemplate,
    metadata?: ResourceMetadata,
    callback: ReadResourceTemplateCallback
};

export class Registration {
    private globalOptionsFn: (CommandFn)[] = [];
    private serveOptionsFn: (CommandFn)[] = [];
    private commandFn: (CommandFn)[] = [];
    private tools: Record<string, Tool<any>> = {};
    private resources: Record<string, Resource> = {};
    private resourceTemplates: Record<string, TemplateResource> = {};
    private _serverOptions: any;
    private _program: Command;

    get serverOptions() {
        return this._serverOptions;
    }

    constructor(public readonly name: string, public readonly description: string, public readonly version: string) {
    }

    addGlobalOption(fn: CommandFn) {
        this.globalOptionsFn.push(fn)
    }

    addServeOption(fn: CommandFn) {
        this.serveOptionsFn.push(fn)
    }

    addCommand(fn: CommandFn) {
        this.commandFn.push(fn)
    }

    addTool<Args extends undefined | ZodRawShape>(tool: Tool<Args>) {
        this.tools[tool.name] = tool
    }

    addResource(resource: Resource) {
        this.resources[resource.uri] = resource
    }

    addResourceTemplate(resource: TemplateResource) {
        this.resourceTemplates[resource.name] = resource
    }


    bindGlobalOptions(command: Command) {
        for (const fn of this.globalOptionsFn) {
            fn(command);
        }
        return command
    }

    bindServerOptions(serveCommand: Command) {
        for (const fn of this.serveOptionsFn) {
            fn(serveCommand);
        }
        return serveCommand;
    }

    bindCommands(command: Command) {
        for (const fn of this.commandFn) {
            fn(command);
        }
        this._program = command
        return command
    }

    bindServer(mcpServer: McpServer, serverOptions: any) {
        this._serverOptions = serverOptions;
        for (const tool of Object.values(this.tools)) {
            if ("args" in tool) {
                mcpServer.tool(tool.name, tool.description, tool.args, async (args: any, extra: any) => {
                    return tool.callback(args, extra);
                });
            } else {
                mcpServer.tool(tool.name, tool.description, async (extra: any) => {
                    return tool.callback(extra);
                });
            }
        }
        for (const resource of Object.values(this.resources)) {
            resource.metadata ?
                mcpServer.resource(resource.name, resource.uri, resource.metadata, resource.callback)
                : mcpServer.resource(resource.name, resource.uri, resource.callback);
        }
        for (const resource of Object.values(this.resourceTemplates)) {
            resource.metadata ?
                mcpServer.resource(resource.name, resource.template, resource.metadata, resource.callback) :
                mcpServer.resource(resource.name, resource.template, resource.callback);
        }
        return mcpServer;
    }

    registerToolAsCommands(program: Command) {
        for (const [toolName, tool] of Object.entries(this.tools)) {
            let command = program.command(toolName)
                .description(tool.description);

            if ('args' in tool) {
                // For tools with arguments, add options based on the Zod schema
                for (const [argName, args] of Object.entries(tool.args)) {
                    // Check if schema is optional by examining its properties
                    const argSchema = args as ZodTypeAny
                    let isOptional = argSchema.isOptional();

                    let isArray = isOptional ?  argSchema._def.innerType instanceof z.ZodArray: argSchema instanceof z.ZodArray;

                    // Get description from the schema if available
                    let description = argSchema.description;
                    const defaultValue = getDefaults(args as ZodTypeAny)

                    // Format option string based on type
                    let optionStr = isArray
                        ? `--${argName} <${argName}...>` // Use ... to indicate multiple values
                        : `--${argName} <${argName}>`;

                    if (isOptional) {
                        command = command.option(
                            optionStr,
                            description,
                            defaultValue
                        );
                    } else {
                        command = command.requiredOption(
                            optionStr,
                            description,
                            defaultValue
                        );
                    }
                }
            }
            // Set up action handler for tools with args
            command = command.action(async (options) => {
                try {
                    // Create a proper options object from command line args
                    const controller = new AbortController();

                    // Process options to handle arrays correctly
                    const processedOptions = { ...options };

                    if ('args' in tool) {
                        for (const [argName, argSchema] of Object.entries(tool.args)) {
                            if (argSchema instanceof z.ZodArray && options[argName]) {
                                // Ensure array values are properly handled
                                // Commander might return a single value or an array depending on input
                                if (!Array.isArray(options[argName])) {
                                    processedOptions[argName] = [options[argName]];
                                }
                            }
                        }
                    }

                    const result = await tool.callback(processedOptions, {
                        signal: controller.signal
                    });
                    if (result && result.content) {
                        // Check if the content is an array with a single item
                        if (Array.isArray(result.content)) {
                            for (const item of result.content) {
                                // Handle resource type with JSON content specially
                                if (item.type === 'resource' &&
                                    item.resource &&
                                    item.resource.mimeType?.includes("json")) {
                                    // Parse and format the JSON with error handling
                                    let jsonData;
                                    try {
                                        jsonData = JSON.parse(item.resource.text as string);
                                    } catch (parseError) {
                                        console.error(`Failed to parse JSON for item: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
                                        jsonData = null; // Fallback to null or handle as needed
                                    }
                                    const output = {
                                        ...item,
                                        resource: {
                                            ...item.resource,
                                            text: jsonData
                                        }
                                    }
                                    console.log(JSON.stringify(output, null, 2));

                                } else {
                                    console.log(item);
                                }
                            }
                        } else {
                            console.log(result.content);
                        }
                    }
                    if (result && result.isError) {
                        process.exit(1);
                    }
                } catch (error) {
                    console.error(`Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`);
                    process.exit(1);
                }
            });
        }
    }

    get globalOptions() {
        return this._program?.opts()
    }
}

function getDefaults(schema: ZodTypeAny) {
    if (schema._def.defaultValue !== undefined) return schema._def.defaultValue()
    if (schema instanceof z.ZodObject) return Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => {
            if (value instanceof z.ZodDefault) return [key, value._def.defaultValue()]
            return [key, undefined]
        })
    )
    if (schema instanceof z.ZodArray) {
        // Return an empty array as default for array types if no default is specified
        return []
    }
    return undefined
}



