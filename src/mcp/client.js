const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
require('dotenv').config();

async function createClient(serverCommandStr, extraArgs = []) {
    // Split the command string by spaces (e.g. "npx -y package")
    // This is a naive split, but sufficient for simple npx commands
    const parts = serverCommandStr.split(' ');
    const command = parts[0];
    // On Windows, npx might need to be explicitly 'npx.cmd' if spawned directly, 
    // but usually cross-spawn handles it. However, if command is 'npx', we might want to ensure compatibility.
    // For now, let's trust the environment or just use the first part.

    const args = [...parts.slice(1), ...extraArgs];

    const transport = new StdioClientTransport({
        command: command,
        args: args,
    });

    const client = new Client({
        name: "express-backend-client",
        version: "1.0.0",
    }, {
        capabilities: {
            prompts: {},
            resources: {},
            tools: {},
        },
    });

    await client.connect(transport);
    return client;
}

let gmailClient;
let calendarClient;

async function initMcpClients() {
    try {
        if (process.env.GMAIL_MCP_SERVER_COMMAND) {
            gmailClient = await createClient(process.env.GMAIL_MCP_SERVER_COMMAND);
            console.log('Connected to Gmail MCP Server');
        }
    } catch (e) {
        console.error('Failed to connect to Gmail MCP Server:', e);
    }


    try {
        if (process.env.GOOGLE_CALENDAR_MCP_SERVER_COMMAND) {
            calendarClient = await createClient(process.env.GOOGLE_CALENDAR_MCP_SERVER_COMMAND);
            console.log('Connected to Google Calendar MCP Server');
        }
    } catch (e) {
        console.error('Failed to connect to Google Calendar MCP Server:', e);
    }
}

function getGmailClient() {
    return gmailClient;
}

function getCalendarClient() {
    return calendarClient;
}

module.exports = { initMcpClients, getGmailClient, getCalendarClient };
