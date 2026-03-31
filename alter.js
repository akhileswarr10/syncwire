const { pool } = require('./src/db/connection');

async function alter() {
  try {
    await pool.query('ALTER TABLE meetings ADD COLUMN IF NOT EXISTS transcript TEXT');
    console.log('Column added (or already exists)');
  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit(0);
}

alter();
