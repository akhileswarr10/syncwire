const fs = require('fs');
const path = require('path');
const { pool } = require('../db/connection');

async function init() {
    try {
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute the entire schema as a single statement block
        // PostgreSQL handles multiple statements in a single query call
        await pool.query(schema);

        console.log('Database initialized successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

init();
