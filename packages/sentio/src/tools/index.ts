import { Registration } from "@mcp3/common";
import { z } from 'zod';
import {SentioClient, toResult} from '../client.js';

/**
 * Register all Sentio tools with the Registration
 * @param registration The Registration instance
 */
export async function registerTools(registration: Registration) {
     
    const client = new SentioClient(registration.globalOptions.sentioEndpoint, registration.globalOptions.sentioApiKey);
    // register all endpoints as mcp tool
    const projects = registration.globalOptions.sentioProjects || []
    for (const project of projects) {
        let projectId = '';
        if (project.indexOf('/') === -1) {
            // use project as id
            projectId = project;
        } else {
            const [owner, slug] = project.split('/');
            // call sentio api to get project id
            const p = await client.getProject(owner, slug)
            if (!p) {
                console.error(`Failed to find project ${project}`)
                continue
            }
        }

        const endpoints = await client.getEndpointList(projectId)
        for (const endpoint of endpoints) {
            // find endpoint docsd
        }
    }
}