const { pool } = require('./src/db/connection');

async function alter() {
  try {
    const conn = await pool.getConnection();
    await conn.query('ALTER TABLE meetings ADD COLUMN transcript LONGTEXT');
    console.log('Column added');
    conn.release();
  } catch(e) {
    if(e.code === 'ER_DUP_FIELDNAME') {
      console.log('Column transcript already exists');
    } else {
      console.log('Error:', e.message);
    }
  }
  process.exit(0);
}

alter();
