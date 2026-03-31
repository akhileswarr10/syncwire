const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { google } = require('googleapis');
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const destroyer = require('server-destroy');

// --- Auth Utils ---
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.join(__dirname, '../../token_calendar.json');
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');

// --- Helper for Date Formatting ---
function normalizeToISOString(dateStr, isEnd = false) {
    if (!dateStr) return null;

    // If it's already a full ISO string (contains T or is long enough), return it
    if (dateStr.includes('T')) return dateStr;

    // If it's just YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return isEnd ? `${dateStr}T23:59:59` : `${dateStr}T09:00:00`;
    }

    // If it ends with Z, remove it to respect local calendar timezone
    if (dateStr.endsWith('Z')) return dateStr.slice(0, -1);

    return dateStr;
}

async function authenticate() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const oauth2Client = new google.auth.OAuth2(
        key.client_id,
        key.client_secret,
        key.redirect_uris[0]
    );

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH);
        oauth2Client.setCredentials(JSON.parse(token));
        return oauth2Client;
    }

    return new Promise((resolve, reject) => {
        const authorizeUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        const oauthPort = process.env.CALENDAR_OAUTH_PORT || 3001;
        const server = http.createServer(async (req, res) => {
            try {
                const qs = new url.URL(req.url, `http://localhost:${oauthPort}`).searchParams;
                const code = qs.get('code');
                res.end('Authentication successful! You can close this tab.');
                server.destroy();

                const { tokens } = await oauth2Client.getToken(code);
                oauth2Client.setCredentials(tokens);
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
                resolve(oauth2Client);
            } catch (e) {
                reject(e);
            }
        }).listen(oauthPort, () => {
            oauth2Client.redirectUri = `http://localhost:${oauthPort}`;
            const finalAuthorizeUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });

            console.error(`\n--- CALENDAR AUTH REQUIRED ---`);
            console.error(`Open this URL to authorize: ${finalAuthorizeUrl}`);
            console.error(`------------------------------\n`);
            require('child_process').exec(`start "" "${finalAuthorizeUrl}"`);
        });
        destroyer(server);
    });
}

// --- MCP Server Setup ---
const server = new Server(
    { name: "calendar-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

let authHelper;

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [{
            name: "create_event",
            description: "Create a Google Calendar event",
            inputSchema: {
                type: "object",
                properties: {
                    summary: { type: "string" },
                    description: { type: "string" },
                    start_time: { type: "string", description: "ISO date string" },
                    end_time: { type: "string", description: "ISO date string" },
                    attendees: {
                        type: "array",
                        items: { type: "string" },
                        description: "List of email addresses to invite"
                    }
                },
                required: ["summary", "start_time", "end_time"]
            }
        }, {
            name: "patch_event",
            description: "Update specific fields of an existing Google Calendar event",
            inputSchema: {
                type: "object",
                properties: {
                    event_id: { type: "string" },
                    summary: { type: "string" },
                    description: { type: "string" },
                    start_time: { type: "string", description: "ISO date string" },
                    end_time: { type: "string", description: "ISO date string" }
                },
                required: ["event_id"]
            }
        }]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "create_event") {
        const { summary, description, start_time, end_time, attendees } = request.params.arguments;

        if (!authHelper) {
            authHelper = await authenticate();
        }

        const calendar = google.calendar({ version: 'v3', auth: authHelper });

        const normalizedStart = normalizeToISOString(start_time);
        const normalizedEnd = normalizeToISOString(end_time, true);

        try {
            // Determine if it should be an all-day event
            // Logic: If it came in as just YYYY-MM-DD or we normalized it to start/end of day
            const isAllDay = !start_time.includes('T') || normalizedStart.endsWith('00:00:00') || normalizedEnd.endsWith('23:59:59');

            const eventBody = {
                summary,
                description,
                attendees: attendees ? attendees.map(email => ({ email })) : []
            };

            if (isAllDay) {
                // For All-Day: Start is the date, End is the NEXT day (exclusive)
                const startDate = normalizedStart.split('T')[0];
                const d = new Date(startDate);
                d.setDate(d.getDate() + 1);
                const endDate = d.toISOString().split('T')[0];

                eventBody.start = { date: startDate };
                eventBody.end = { date: endDate };
            } else {
                eventBody.start = { dateTime: normalizedStart, timeZone: 'Asia/Kolkata' };
                eventBody.end = { dateTime: normalizedEnd, timeZone: 'Asia/Kolkata' };
            }

            console.error(`[INFO] Creating ${isAllDay ? 'All-Day ' : ''}event: "${summary}" for ${eventBody.start.date || eventBody.start.dateTime}`);

            const response = await calendar.events.insert({
                calendarId: 'primary',
                sendUpdates: 'all',
                requestBody: eventBody
            });
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify({
                        message: "Event created successfully",
                        id: response.data.id,
                        htmlLink: response.data.htmlLink
                    })
                }]
            };
        } catch (error) {
            console.error(`[ERROR] Calendar insert failed:`, error.message);
            if (error.message.includes('invalid_grant')) {
                if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
                authHelper = null;
            }
            throw error;
        }
    }

    if (request.params.name === "patch_event") {
        const { event_id, summary, description, start_time, end_time } = request.params.arguments;

        if (!authHelper) authHelper = await authenticate();
        const calendar = google.calendar({ version: 'v3', auth: authHelper });

        const patchBody = {};
        if (summary) patchBody.summary = summary;
        if (description) patchBody.description = description;
        if (start_time) {
            const normalizedStart = normalizeToISOString(start_time);
            patchBody.start = start_time.includes('T') ? { dateTime: normalizedStart } : { date: normalizedStart.split('T')[0] };
        }
        if (end_time) {
            const normalizedEnd = normalizeToISOString(end_time, true);
            patchBody.end = end_time.includes('T') ? { dateTime: normalizedEnd } : { date: normalizedEnd.split('T')[0] };
        }

        try {
            const response = await calendar.events.patch({
                calendarId: 'primary',
                eventId: event_id,
                sendUpdates: 'all',
                requestBody: patchBody
            });
            return {
                content: [{
                    type: "text",
                    text: `Event updated: ${response.data.htmlLink}`
                }]
            };
        } catch (error) {
            console.error(`[ERROR] Calendar patch failed:`, error.message);
            throw error;
        }
    }
    throw new Error("Tool not found");
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Calendar MCP Server running on stdio");
}

run().catch(console.error);
