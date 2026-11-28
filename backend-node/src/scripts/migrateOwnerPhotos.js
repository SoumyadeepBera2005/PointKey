const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/db');

async function migrate() {
  const uploadsDir = path.join(__dirname, '../../uploads');
  const f1Path = path.join(uploadsDir, '1795849006187_Screenshot_2026-09-16_113748.png');
  const f2Path = path.join(uploadsDir, '1795849006210_Screenshot_2026-09-16_113748.png');
  const f3Path = path.join(uploadsDir, '1795849006214_Screenshot_2026-09-16_113748.png');
  const fBillPath = path.join(uploadsDir, '1795849006225_Screenshot_2026-09-16_113748.png');

  const f1 = fs.readFileSync(f1Path);
  const f2 = fs.readFileSync(f2Path);
  const f3 = fs.readFileSync(f3Path);
  const fBill = fs.readFileSync(fBillPath);

  const d1 = 'data:image/png;base64,' + f1.toString('base64');
  const d2 = 'data:image/png;base64,' + f2.toString('base64');
  const d3 = 'data:image/png;base64,' + f3.toString('base64');
  const dBill = 'data:image/png;base64,' + fBill.toString('base64');

  const photos = [
    { label: 'Angle 1 (Front/Entrance)', name: 'Screenshot 2026-09-16 113748.png', url: d1 },
    { label: 'Angle 2 (Living/Bedroom)', name: 'Screenshot 2026-09-16 113748.png', url: d2 },
    { label: 'Angle 3 (Balcony/Kitchen/Side)', name: 'Screenshot 2026-09-16 113748.png', url: d3 },
  ];

  await db.query(
    'UPDATE properties SET cover_url = ?, photos = ?, electricity_bill_url = ? WHERE id = ?',
    [d1, JSON.stringify(photos), dBill, 'de649241-9ae6-413a-8fc3-3eaa4e2a81c0']
  );

  try {
    await db.query('DELETE FROM property_media WHERE property_id = ?', ['de649241-9ae6-413a-8fc3-3eaa4e2a81c0']);
    await db.query(
      'INSERT INTO property_media (id, property_id, room_tag, media_type, media_url, captured_date, is_cover) VALUES (?, ?, ?, ?, ?, NOW(), ?), (?, ?, ?, ?, ?, NOW(), ?), (?, ?, ?, ?, ?, NOW(), ?)',
      [
        require('crypto').randomUUID(), 'de649241-9ae6-413a-8fc3-3eaa4e2a81c0', 'EXTERIOR', 'IMAGE', d1, 1,
        require('crypto').randomUUID(), 'de649241-9ae6-413a-8fc3-3eaa4e2a81c0', 'BEDROOM', 'IMAGE', d2, 0,
        require('crypto').randomUUID(), 'de649241-9ae6-413a-8fc3-3eaa4e2a81c0', 'KITCHEN', 'IMAGE', d3, 0
      ]
    );
  } catch (err) {
    console.warn('property_media update note:', err.message);
  }

  console.log('✅ Successfully updated property de649241 with real owner base64 photos!');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
