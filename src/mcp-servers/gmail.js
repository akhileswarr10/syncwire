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
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(__dirname, '../../token_gmail.json');
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');

async function authenticate() {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    // Support both 'installed' and 'web' types
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

        const oauthPort = process.env.GMAIL_OAUTH_PORT || 3002;
        // Simple local server to handle callback
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
            // Update redirect URI to the fixed port
            oauth2Client.redirectUri = `http://localhost:${oauthPort}`;
            // Re-generate URL with correct redirect
            const finalAuthorizeUrl = oauth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });

            // NOTE: We print to stderr so it doesn't mess up the MCP stdio transport
            console.error(`\n--- GMAIL AUTH REQUIRED ---`);
            console.error(`Open this URL to authorize: ${finalAuthorizeUrl}`);
            console.error(`---------------------------\n`);
            require('child_process').exec(`start "" "${finalAuthorizeUrl}"`);
        });
        destroyer(server);
    });
}

// --- MCP Server Setup ---
const server = new Server(
    { name: "gmail-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

let authHelper;

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [{
            name: "send_email",
            description: "Send an email via Gmail",
            inputSchema: {
                type: "object",
                properties: {
                    to: { type: "string" },
                    subject: { type: "string" },
                    body: { type: "string" }
                },
                required: ["to", "subject", "body"]
            }
        }]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "send_email") {
        const { to, subject, body } = request.params.arguments;

        if (!authHelper) {
            authHelper = await authenticate();
        }

        const gmail = google.gmail({ version: 'v1', auth: authHelper });

        // Encode email in base64url
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const emailLines = [
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            `Content-Type: text/plain; charset=utf-8`,
            `MIME-Version: 1.0`,
            ``,
            body
        ];
        const email = emailLines.join('\r\n').trim();
        const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        try {
            await gmail.users.messages.send({
                userId: 'me',
                requestBody: { raw: encodedEmail }
            });
        } catch (error) {
            if (error.message.includes('invalid_grant')) {
                console.error("[ERROR] Gmail Auth failed (invalid_grant). Deleting token to force re-auth.");
                if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
                authHelper = null; // Reset for next attempt
            }
            throw error;
        }

        return { content: [{ type: "text", text: "Email sent successfully" }] };
    }
    throw new Error("Tool not found");
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Gmail MCP Server running on stdio");
}

run().catch(console.error);
