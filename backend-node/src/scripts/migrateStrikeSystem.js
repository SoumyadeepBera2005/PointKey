const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const db = require('../config/db');

async function migrate() {
  console.log('🔄 Updating database schema for Strike & Unblock system...');
  try {
    // 1. Modify account_status to VARCHAR(30) to allow 'SUSPENDED', 'BLOCKED', 'ACTIVE', 'DELETED'
    await db.query(`ALTER TABLE users MODIFY account_status VARCHAR(30) DEFAULT 'ACTIVE';`);
    console.log('✅ Modified users.account_status to VARCHAR(30)');

    // 2. Add columns safely
    const addCol = async (sql) => {
      try {
        await db.query(sql);
      } catch (err) {
        if (!err.message.includes('Duplicate column') && !err.message.includes('already exists')) {
          console.warn('Column add note:', err.message);
        }
      }
    };

    await addCol(`ALTER TABLE users ADD COLUMN strike_count INT DEFAULT 0;`);
    await addCol(`ALTER TABLE users ADD COLUMN block_reason VARCHAR(255) NULL;`);
    await addCol(`ALTER TABLE users ADD COLUMN unblock_appeal_status VARCHAR(30) DEFAULT 'NONE';`);
    await addCol(`ALTER TABLE users ADD COLUMN unblock_appeal_text TEXT NULL;`);
    await addCol(`ALTER TABLE users ADD COLUMN unblock_appeal_date DATETIME NULL;`);

    console.log('✅ Added strike_count, block_reason, unblock_appeal_status, unblock_appeal_text, unblock_appeal_date columns!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  }
}

migrate();
