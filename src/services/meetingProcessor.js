const OpenAI = require('openai');
const crypto = require('crypto');
const { pool } = require('../db/connection');
const { getGmailClient, getCalendarClient } = require('../mcp/client');
require('dotenv').config();

const openai = new OpenAI({
    baseURL: process.env.SAMBANOVA_BASE_URL || 'https://api.sambanova.ai/v1',
    apiKey: process.env.SAMBANOVA_API_KEY
});

async function processTranscript(transcript, recipientEmails = [], manualAssignee = null) {
    // Ensure recipientEmails is always an array
    if (!Array.isArray(recipientEmails)) {
        recipientEmails = recipientEmails ? [recipientEmails] : [];
    }

    try {
        // ... (AI and DB logic remains same, skippingLines 14-97) ...

        // 1. Analyze transcript with SambaNova (Llama 3.1 8B Instruct)
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert meeting assistant. Analyze the provided meeting transcript and return a valid JSON object.
Do not include any conversational text, markdown formatting (like \`\`\`json), or explanations. Start the response immediately with '{'.

Structure:
{
  "title": "Meeting Title",
  "summary": "3-paragraph summary",
  "participants_emails": ["email1@example.com", "email2@example.com"],
  "tasks": [
    {
      "assignee_email": "email or placeholder",
      "description": "Short task description",
      "detailed_context": "Detailed instructions from the transcript including what, how, and why.",
      "deadline": "ISO 8601 date (YYYY-MM-DDTHH:mm:ssZ)"
    }
  ]
}
Each task should include a 'detailed_context' field that captures the specific nuance and context discussed for that task in the meeting.

CRITICAL DATE RULE: All task 'deadline' dates MUST be in the future relative to today's date (${new Date().toISOString().split('T')[0]}). Under no circumstances should you generate a deadline that is in the past.`
                },
                { role: "user", content: transcript }
            ],
            model: process.env.SAMBANOVA_MODEL || "Meta-Llama-3.1-8B-Instruct",
            temperature: 0.1
        });

        let content = chatCompletion.choices[0].message.content;
        console.log("--- Raw AI Response ---\n", content, "\n-----------------------");

        // Clean up potential markdown code blocks if the model behaves poorly
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        // Robust JSON extraction: Find first '{' and last '}'
        const firstOpen = content.indexOf('{');
        const lastClose = content.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1) {
            content = content.substring(firstOpen, lastClose + 1);
        } else {
            throw new Error(`Could not find JSON object in AI response: ${content.substring(0, 50)}...`);
        }

        let analysis;
        try {
            analysis = JSON.parse(content);

            // Override Assignee if manualAssignee is provided
            if (manualAssignee && analysis.tasks) {
                analysis.tasks.forEach(task => {
                    task.assignee_email = manualAssignee;
                });
                console.log(`Overrode task assignees to: ${manualAssignee}`);
            }

        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            throw new Error(`Failed to parse AI response: ${parseError.message}. Content: ${content.substring(0, 100)}...`);
        }

        // 2. Save to Database
        const client = await pool.connect();
        let meetingId;

        try {
            await client.query('BEGIN');

            const meetingResult = await client.query(
                'INSERT INTO meetings (title, summary, transcript, date) VALUES ($1, $2, $3, $4) RETURNING id',
                [analysis.title, analysis.summary, transcript, new Date()]
            );
            meetingId = meetingResult.rows[0].id;

            if (analysis.tasks && analysis.tasks.length > 0) {
                for (const task of analysis.tasks) {
                    const magicToken = crypto.randomBytes(32).toString('hex');
                    const taskResult = await client.query(
                        'INSERT INTO tasks (meeting_id, assignee_email, description, detailed_context, deadline, task_status, magic_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                        [meetingId, task.assignee_email, task.description, task.detailed_context, task.deadline, 'pending', magicToken]
                    );
                    task.id = taskResult.rows[0].id;
                    task.magic_token = magicToken;
                }
            }

            await client.query('COMMIT');
            console.log(`Meeting processed and saved with ID: ${meetingId}`);

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

        // 3. Execute MCP Actions (Email, etc.)
        await executeMcpActions(analysis, meetingId, recipientEmails);

        return { success: true, meetingId, analysis };

    } catch (error) {
        console.error("Error in processTranscript:", error);
        throw error;
    }
}

async function executeMcpActions(analysis, meetingId, recipientEmails) {
    // 3c. Send Emails via Gmail MCP
    const gmail = getGmailClient();

    if (gmail) {
        // 1. Send the full summary to ALL recipient emails provided AND all participants found in the transcript
        const summaryRecipients = new Set([...recipientEmails]);

        if (analysis.participants_emails && Array.isArray(analysis.participants_emails)) {
            analysis.participants_emails.forEach(email => summaryRecipients.add(email));
        }

        if (summaryRecipients.size > 0) {
            for (const email of summaryRecipients) {
                try {
                    const emailBody = `
Meeting Title: ${analysis.title}
Date: ${new Date().toLocaleString()}

Summary:
${analysis.summary}

Tasks Identified:
${analysis.tasks.map(t => `- ${t.description} (Assigned to: ${t.assignee_email})`).join('\n')}
                    `.trim();

                    await gmail.callTool({
                        name: "send_email",
                        arguments: {
                            to: email,
                            subject: `Meeting Summary: ${analysis.title}`,
                            body: emailBody
                        }
                    });
                    console.log(`Meeting summary sent to ${email}`);
                } catch (error) {
                    console.error(`Failed to send summary to ${email}:`, error.message);
                    if (error.stack) console.error(error.stack);
                }
            }
        } else {
            console.log('No summary recipients found.');
        }

        // 2. Send individual task assignments
        for (const task of analysis.tasks) {
            // Determine the list of people to send this task to.
            // If recipientEmails are provided (testing mode), send to ALL of them.
            // Otherwise, send to the original assignee.

            const emailsToSend = recipientEmails.length > 0 ? recipientEmails : [task.assignee_email];
            const subjectPrefix = recipientEmails.length > 0 ? `[TEST - Orig: ${task.assignee_email}] ` : '';

            for (const emailTo of emailsToSend) {
                try {
                    const magicLink = `http://localhost:3000/task-update/${task.magic_token}`;
                    const taskEmailBody = `
Hello,

You have been assigned a new task from the meeting: "${analysis.title}".

Task: ${task.description}
Deadline: ${task.deadline}

Details & Context:
${task.detailed_context || 'No additional details provided.'}

---
⚡ MAGIC LINK: 
Click below to mark this as completed or request an extension:
${magicLink}
---

Meeting Summary:
${analysis.summary}

Best regards,
Meeting Assistant
                    `.trim();

                    await gmail.callTool({
                        name: "send_email",
                        arguments: {
                            to: emailTo,
                            subject: `${subjectPrefix}Task Assignment: ${task.description}`,
                            body: taskEmailBody
                        }
                    });
                    console.log(`Email sent to ${emailTo} via MCP`);
                } catch (mcpError) {
                    console.error(`Failed to send email to ${emailTo} via MCP:`, mcpError.message);
                    if (mcpError.stack) console.error(mcpError.stack);
                }
            }
        }
    } else {
        console.warn('Gmail MCP Client not available. Skipping email notifications.');
    }

    // 3d. Create Calendar Events via Google Calendar MCP
    const calendar = getCalendarClient();
    if (calendar) {
        for (const task of analysis.tasks) {
            try {
                const startTime = task.deadline;
                const endTime = startTime;

                console.log(`[CALENDAR] Marking deadline for task: "${task.description}" on ${startTime}`);

                const magicLink = `http://localhost:3000/task-update/${task.magic_token}`;
                const enrichedDescription = `
Assigned from meeting: ${analysis.title}

Summary:
${analysis.summary}

Task Details: 
${task.detailed_context}

---
⚡ UPDATE TASK:
${magicLink}
                `.trim();

                console.log(`[CALENDAR] Marking deadline for task: "${task.description}" on ${startTime}`);

                const response = await calendar.callTool({
                    name: "create_event",
                    arguments: {
                        summary: `Task: ${task.description}`,
                        description: enrichedDescription,
                        start_time: startTime,
                        end_time: endTime,
                        attendees: [task.assignee_email]
                    }
                });

                const rawResult = response.content.find(c => c.type === 'text')?.text || '{}';
                try {
                    const resultData = JSON.parse(rawResult);
                    if (resultData.id) {
                        await pool.query(
                            'UPDATE tasks SET calendar_event_id = $1 WHERE id = $2',
                            [resultData.id, task.id]
                        );
                        console.log(`[CALENDAR] Saved event ID ${resultData.id} for task ${task.id}`);
                    }
                    console.log(`[CALENDAR] Success: ${resultData.htmlLink}`);
                } catch (e) {
                    console.log(`[CALENDAR] Tool returned non-JSON: ${rawResult}`);
                }
            } catch (mcpError) {
                console.error(`[CALENDAR] Error creating event for "${task.description}":`, mcpError.message);
                if (mcpError.stack) console.error(mcpError.stack);
            }
        }
    } else {
        console.warn('[CALENDAR] Client not available. Skipping event creation.');
    }
}

module.exports = { processTranscript };
