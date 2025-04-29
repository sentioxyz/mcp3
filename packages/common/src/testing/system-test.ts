import {Registration, Tool} from "../system.js";
import {RequestHandlerExtra} from "@modelcontextprotocol/sdk/shared/protocol.js";

import {CallToolResult, ServerNotification, ServerRequest} from "@modelcontextprotocol/sdk/types.js";


/**
 * TestRegistration class for testing purposes
 * Extends Registration to provide additional functionality for testing
 */
export class TestRegistration extends Registration {
    private _globalOptions: Record<string, any> = {};

    /**
     * Create a new TestRegistration instance
     * @param name The name of the registration
     * @param description The description of the registration
     * @param version The version of the registration
     * @returns The TestRegistration instance
     */
    public static createTest(name: string, description: string, version: string): TestRegistration {
        // Reset the singleton instance to allow creating a test instance
        (Registration as any).instance = null;
        const instance = new TestRegistration(name, description, version);
        (Registration as any).instance = instance;
        return instance;
    }

    /**
     * Constructor for TestRegistration
     */
    protected constructor(name: string, description: string, version: string) {
        super(name, description, version);
    }

    /**
     * Set global options for testing
     * @param options The options to set
     */
    setGlobalOptions(options: Record<string, any>) {
        this._globalOptions = options;
    }

    /**
     * Override globalOptions getter to return test options
     */
    override get globalOptions() {
        return this._globalOptions;
    }

    /**
     * Get all registered tools
     * @returns Record of tool name to tool
     */
    get registeredTools(): Record<string, Tool<any>> {
        return this.tools;
    }

    /**
     * Call a tool directly for testing purposes
     * @param toolName The name of the tool to call
     * @param args The arguments to pass to the tool
     * @param extra Additional request handler extras
     * @returns The result of the tool call
     */
    async call(toolName: string, args: any = {}, extra: Partial<RequestHandlerExtra<ServerRequest, ServerNotification>> = {}): Promise<CallToolResult> {
        const tool = this.tools[toolName];
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }

        const sendNotification = async (_: any): Promise<void> => {
        }
        const sendRequest = async (_: ServerRequest, _2: any): Promise<any> => {
        }

        const defaultExtra: RequestHandlerExtra<ServerRequest, ServerNotification> = {
            signal: new AbortController().signal,
            sendRequest,
            sendNotification,
        };

        const mergedExtra = {...defaultExtra, ...extra};

        return tool.callback(args, mergedExtra);
    }
}



