const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('./db/connection');
const { initMcpClients } = require('./mcp/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize DB and MCP Clients
initDB();
initMcpClients();

const { processTranscript } = require('./services/meetingProcessor');

// Route to get all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT t.*, m.title as meeting_title, m.transcript as meeting_transcript 
            FROM tasks t 
            JOIN meetings m ON t.meeting_id = m.id 
            ORDER BY t.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// GET task by Magic Token
app.get('/api/tasks/token/:token', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT t.*, m.title as meeting_title, m.summary as meeting_summary 
            FROM tasks t 
            JOIN meetings m ON t.meeting_id = m.id 
            WHERE t.magic_token = $1
        `, [req.params.token]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired magic link' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching task by token:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task status (Complete)
app.post('/api/tasks/update-status', async (req, res) => {
    const { token, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET task_status = $1 WHERE magic_token = $2',
            [status, token]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: `Task status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request Extension
app.post('/api/tasks/request-extension', async (req, res) => {
    const { token, reason, requestedDeadline } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tasks SET task_status = $1, reason_for_delay = $2, requested_deadline = $3 WHERE magic_token = $4',
            ['extension_requested', reason, requestedDeadline, token]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Extension request submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve Extension (Admin)
app.post('/api/tasks/approve-extension', async (req, res) => {
    const { taskId } = req.body;
    try {
        // 1. Get task details
        const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
        const task = rows[0];

        // 2. Update status and deadline in PostgreSQL
        await pool.query(
            'UPDATE tasks SET task_status = $1, deadline = $2, requested_deadline = NULL WHERE id = $3',
            ['extended', task.requested_deadline, taskId]
        );

        // 3. Trigger MCP Calendar Sync
        const { getCalendarClient } = require('./mcp/client');
        const calendar = getCalendarClient();
        if (calendar) {
            try {
                if (task.calendar_event_id) {
                    await calendar.callTool({
                        name: "patch_event",
                        arguments: {
                            event_id: task.calendar_event_id,
                            summary: `[EXTENDED] ${task.description}`,
                            start_time: task.requested_deadline,
                            end_time: task.requested_deadline // Server logic handles +1 day for all-day
                        }
                    });
                    console.log(`[CALENDAR] Patched event ${task.calendar_event_id} for task ${taskId}`);
                } else {
                    // Fallback to create if ID is missing
                    await calendar.callTool({
                        name: "create_event",
                        arguments: {
                            summary: `[EXTENDED] ${task.description}`,
                            description: task.detailed_context,
                            start_time: task.requested_deadline,
                            end_time: task.requested_deadline
                        }
                    });
                }
            } catch (cpError) {
                console.error("Failed to update calendar via MCP:", cpError.message);
            }
        }

        // 4. Trigger Gmail Notification
        const gmail = getGmailClient();
        if (gmail) {
            try {
                await gmail.callTool({
                    name: "send_email",
                    arguments: {
                        to: task.assignee_email,
                        subject: `Extension Approved: ${task.description}`,
                        body: `Your request for more time on "${task.description}" has been approved. Your new deadline is ${task.requested_deadline}.`
                    }
                });
            } catch (gmError) {
                console.error("Failed to notify via Gmail:", gmError.message);
            }
        }

        res.json({ message: 'Extension approved and calendar/email updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to process meeting transcript via AI
app.post('/api/process', async (req, res) => {
    try {
        const { transcript, recipient_emails, recipient_email, manual_assignee } = req.body;

        let recipients = [];
        if (recipient_emails && Array.isArray(recipient_emails)) {
            recipients = recipient_emails;
        } else if (recipient_email) {
            recipients = [recipient_email];
        }

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        const result = await processTranscript(transcript, recipients, manual_assignee);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error processing meeting:', error);
        res.status(500).json({ error: 'Failed to process meeting', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
