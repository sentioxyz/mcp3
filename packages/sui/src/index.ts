// Export core functionality
import {Registration} from "@mcp3/common";

const availableSubProjects = [
    '@mcp3/sui-wallets',
    '@mcp3/sui-navi',
    '@mcp3/sui-cetus',
    '@mcp3/defilama'
]

export async function registerSubProjects(registration: Registration) {
    for (const subProject of availableSubProjects) {
        try {
            const subProjectModule = await import(subProject);
            subProjectModule.register(registration);
            console.error(`Loaded subproject ${subProject}`);
        } catch (e) {
            // Ignore errors
            console.error(`Subproject ${subProject} not found, skipped`, e);
        }
    }
}