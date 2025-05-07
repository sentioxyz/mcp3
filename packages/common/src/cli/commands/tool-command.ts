import {Command} from "commander";
import {Registration} from "../../system.js";

export function registerToolsAsSubcommands(program: Command, registration: Registration, registerToolCallback: (reg: Registration) => Promise<void>) {
    // Create a main 'tool' command
    const toolCommand = program.command('tool')
        .description('Execute or list available tools')
        .action(async () => {
            await registerToolCallback(registration);
            registration.registerToolAsCommands(toolCommand);

            // When no subcommand is specified, list all available tools
            console.log('Available tools:')
            console.log('')

            // Group tools by prefix (e.g., 'sui-cetus', 'sui-wallets', etc.)
            const toolsByPrefix: Record<string, {name: string, description: string}[]> = {};

            for (const [toolName, tool] of Object.entries(registration.getAllTools())) {
                const prefix = toolName.split('-')[0];
                if (!toolsByPrefix[prefix]) {
                    toolsByPrefix[prefix] = [];
                }
                toolsByPrefix[prefix].push({
                    name: toolName,
                    description: tool.description
                });
            }

            // Display tools grouped by prefix
            for (const [prefix, tools] of Object.entries(toolsByPrefix)) {
                console.log(`${prefix} tools:`);
                for (const tool of tools) {
                    console.log(`  ${tool.name.padEnd(40)} ${tool.description}`);
                }
                console.log('');
            }

            // Display usage information
            console.log('To execute a tool, use:');
            console.log(`  ${program.name()} tool <tool-name> --help`);
            console.log('For example:');

            // Get a sample tool name for the example
            const sampleTool = Object.values(toolsByPrefix)[0]?.[0]?.name || 'tool-name';
            console.log(`  ${program.name()} tool ${sampleTool} --help`);
            console.log(`  ${program.name()} tool ${sampleTool} [options]`);
            console.log('');
        });

}
