const fs = require('fs');
const path = require('path');
const { pool } = require('../db/connection');

async function init() {
    try {
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon to get individual queries (basic splitting)
        const queries = schema.split(';').filter(q => q.trim());

        const connection = await pool.getConnection();

        for (const query of queries) {
            if (query.trim()) {
                await connection.query(query);
            }
        }

        console.log('Database initialized successfully');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

init();
