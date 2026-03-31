const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool best practices (conn-limits, conn-pooling)
  max: 10,                       // Max pool size — free tier safe
  idleTimeoutMillis: 30000,      // Close idle connections after 30s
  connectionTimeoutMillis: 10000 // Fail fast on network issues
});

async function initDB() {
  try {
    const client = await pool.connect();
    console.log('Connected to Supabase PostgreSQL database');
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err);
  }
}

module.exports = { pool, initDB };
