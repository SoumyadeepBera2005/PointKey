require('dotenv').config({ path: __dirname + '/../../.env' });
const db = require('../config/db');

async function upgrade() {
  try {
    console.log('Upgrading properties table schema...');
    await db.query("ALTER TABLE properties MODIFY COLUMN verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'");
    await db.query("ALTER TABLE properties MODIFY COLUMN category VARCHAR(50) NOT NULL DEFAULT 'FLAT'");
    await db.query("ALTER TABLE properties MODIFY COLUMN sub_type VARCHAR(50) NOT NULL DEFAULT '2BHK'");
    await db.query("ALTER TABLE properties MODIFY COLUMN bathroom_type VARCHAR(50) NOT NULL DEFAULT 'PRIVATE'");
    await db.query("ALTER TABLE properties MODIFY COLUMN allowed_gender VARCHAR(50) NOT NULL DEFAULT 'ANY'");
    await db.query("ALTER TABLE properties MODIFY COLUMN allowed_tenant_type VARCHAR(50) NOT NULL DEFAULT 'ANY'");

    const [cols] = await db.query('DESCRIBE properties');
    const colNames = cols.map((c) => c.Field);

    if (!colNames.includes('lister_type')) {
      await db.query("ALTER TABLE properties ADD COLUMN lister_type VARCHAR(50) DEFAULT 'Owner'");
    }
    if (!colNames.includes('furnishing_status')) {
      await db.query("ALTER TABLE properties ADD COLUMN furnishing_status VARCHAR(50) DEFAULT 'Semi-furnished'");
    }
    if (!colNames.includes('cover_url')) {
      await db.query('ALTER TABLE properties ADD COLUMN cover_url TEXT NULL');
    }
    if (!colNames.includes('photos')) {
      await db.query('ALTER TABLE properties ADD COLUMN photos JSON NULL');
    }
    if (!colNames.includes('video_url')) {
      await db.query('ALTER TABLE properties ADD COLUMN video_url TEXT NULL');
    }
    if (!colNames.includes('video_name')) {
      await db.query('ALTER TABLE properties ADD COLUMN video_name VARCHAR(255) NULL');
    }
    if (!colNames.includes('electricity_bill_url')) {
      await db.query('ALTER TABLE properties ADD COLUMN electricity_bill_url TEXT NULL');
    }
    if (!colNames.includes('electricity_bill_name')) {
      await db.query('ALTER TABLE properties ADD COLUMN electricity_bill_name VARCHAR(255) NULL');
    }
    if (!colNames.includes('alternate_phone')) {
      await db.query('ALTER TABLE properties ADD COLUMN alternate_phone VARCHAR(20) NULL');
    }

    console.log('✅ properties table successfully upgraded with all columns!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Upgrade error:', err);
    process.exit(1);
  }
}

upgrade();
