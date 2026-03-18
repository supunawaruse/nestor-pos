const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'pos',
});

async function check() {
  try {
    console.log('--- Sales by Date ---');
    const { rows } = await pool.query('SELECT DATE(created_at) as date, COUNT(*) FROM sales GROUP BY date ORDER BY date DESC;');
    console.table(rows);
    
    console.log('\n--- Sample Sales ---');
    const sales = await pool.query('SELECT id, created_at FROM sales LIMIT 5;');
    console.table(sales.rows);
  } catch (err) { console.error(err); }
  finally { await pool.end(); }
}

check();
