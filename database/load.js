/**
 * One-time database loader: applies database/schema.sql then database/seed.sql
 * to the MySQL instance configured in backend-node/.env.
 * Usage:  node database/load.js          (from prent-platform/ folder)
 */
const fs = require('fs');
const path = require('path');
const NM = path.join(__dirname, '..', 'backend-node', 'node_modules');
const mysql = require(path.join(NM, 'mysql2', 'promise'));

async function main() {
  require(path.join(NM, 'dotenv')).config({ path: path.join(__dirname, '..', 'backend-node', '.env') });
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    connectTimeout: 5000,
  });
  for (const file of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    try {
      await conn.query(sql);
      console.log(`${file} applied successfully`);
    } catch (e) {
      console.log(`${file} error: ${e.code} ${e.message}`);
      console.log('(duplicate entry / table already exists errors are safe to ignore on re-runs)');
    }
  }
  const [tables] = await conn.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'prent_db' ORDER BY 1"
  );
  console.log('prent_db tables:', tables.map((t) => t.TABLE_NAME || t.table_name).join(', '));
  const [users] = await conn.query("SELECT email, role, account_status FROM prent_db.users");
  console.log('seeded users     :', users.map((u) => `${u.email} (${u.role})`).join(', '));
  await conn.end();
}

main().catch((e) => { console.error('DB load failed:', e.code || e.message); process.exit(1); });
