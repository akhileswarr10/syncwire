const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    // Create database if not exists (trickier with pool if DB doesn't exist yet, 
    // usually we assume DB exists or we connect without DB to create it.
    // For simplicity, we assume the DB 'meeting_db' might need to be created manually or we adjust the connection.)
    
    // Actually, let's try to connect and check connection
    const connection = await pool.getConnection();
    console.log('Connected to MySQL database');
    connection.release();
  } catch (err) {
    console.error('Error connecting to MySQL:', err);
  }
}

module.exports = { pool, initDB };
