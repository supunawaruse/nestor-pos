const db = require('./db');

async function check() {
  try {
    const { rows: stats } = await db.query('SELECT DATE(created_at) as date, COUNT(*) FROM sales GROUP BY date;');
    console.log('STATS:', JSON.stringify(stats, null, 2));

    const { rows: joins } = await db.query(`
      SELECT s.id, s.created_at, COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id, s.created_at
      LIMIT 5;
    `);
    console.log('JOINS:', JSON.stringify(joins, null, 2));
  } catch (err) { console.error(err); }
  finally { process.exit(); }
}

check();
