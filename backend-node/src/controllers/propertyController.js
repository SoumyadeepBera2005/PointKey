const db = require('../config/db');
const { maskProperty } = require('../middlewares/privacyGuard');

const PROPERTY_SELECT = `
  SELECT p.id, p.property_code, p.owner_id, p.title, p.category, p.sub_type, p.allowed_gender,
         p.allowed_tenant_type, p.room_sharing_capacity, p.bathroom_type, p.kitchen_available,
         p.food_included, p.rent_amount, p.advance_amount, p.contract_months,
         p.water_bill_included, p.electricity_bill_included, p.size_sqft, p.roof_floor_type,
         p.room_materials, p.rules_and_regulations, p.allow_parents_friends, p.nearby_landmarks,
         p.locality, p.city, p.exact_address, p.booking_status, p.verification_status,
         p.average_rating, p.created_at,
         u.full_name AS owner_name, u.phone AS owner_phone, u.whatsapp_number AS owner_whatsapp,
         u.email AS owner_email, u.verification_status AS owner_verification_status
  FROM properties p JOIN users u ON u.id = p.owner_id`;

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v; // mysql2 may already parse JSON columns
  try { return JSON.parse(v); } catch { return v; }
}

// GET /api/v1/properties/:id  (optionalAuth + applyPropertyPrivacy applied in route)
async function getProperty(req, res, next) {
  try {
    const [[raw]] = await db.query(`${PROPERTY_SELECT} WHERE p.id = ?`, [req.params.id]);
    if (!raw) return res.status(404).json({ message: 'Property not found' });
    const property = maskProperty({ ...raw }, req.isPropertyUnlocked);
    property.room_materials = parseJson(raw.room_materials);
    property.nearby_landmarks = parseJson(raw.nearby_landmarks);
    if (req.isPropertyUnlocked) {
      const [[coords]] = await db.query(
        'SELECT ST_Longitude(location) AS lng, ST_Latitude(location) AS lat FROM properties WHERE id = ?',
        [req.params.id]
      );
      property.location = coords ? { lat: Number(coords.lat), lng: Number(coords.lng) } : null;
    }
    const [media] = await db.query(
      'SELECT * FROM property_media WHERE property_id = ? ORDER BY is_cover DESC, captured_date DESC',
      [req.params.id]
    );
    property.media = media;
    res.json({ property, unlocked: Boolean(req.isPropertyUnlocked) });
  } catch (e) { next(e); }
}

// GET /api/v1/properties/owner/my-listings
async function myListings(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.property_code, p.title, p.category, p.sub_type, p.rent_amount, p.booking_status,
              p.verification_status, p.average_rating, p.created_at,
              (SELECT media_url FROM property_media m WHERE m.property_id = p.id ORDER BY m.is_cover DESC LIMIT 1) AS cover_url
       FROM properties p WHERE p.owner_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (e) { next(e); }
}

// POST /api/v1/properties  (OWNER only)
async function createProperty(req, res, next) {
  try {
    const b = req.body;
    const required = ['title', 'category', 'sub_type', 'allowed_gender', 'allowed_tenant_type',
      'bathroom_type', 'rent_amount', 'advance_amount', 'locality', 'city', 'exact_address', 'lat', 'lng'];
    for (const k of required) if (b[k] === undefined || b[k] === '') return res.status(400).json({ message: `Missing field: ${k}` });

    const prefix = b.category === 'PG' ? 'PG' : b.category === 'FLAT' ? 'F' : 'R';
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM properties');
    const property_code = `${prefix}${String(Number(cnt) + 1).padStart(2, '0')}`;

    await db.query(
      `INSERT INTO properties
        (id, property_code, owner_id, title, category, sub_type, allowed_gender, allowed_tenant_type,
         room_sharing_capacity, bathroom_type, kitchen_available, food_included, rent_amount, advance_amount,
         contract_months, water_bill_included, electricity_bill_included, size_sqft, roof_floor_type,
         room_materials, rules_and_regulations, allow_parents_friends, nearby_landmarks,
         locality, city, exact_address, location, verification_status)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?), 4326, 'axis-order=long-lat'), 'PENDING')`,
      [property_code, req.user.id, b.title, b.category, b.sub_type, b.allowed_gender, b.allowed_tenant_type,
       b.room_sharing_capacity || 1, b.bathroom_type, b.kitchen_available !== false, Boolean(b.food_included),
       b.rent_amount, b.advance_amount, b.contract_months || 6, Boolean(b.water_bill_included), Boolean(b.electricity_bill_included),
       b.size_sqft || null, b.roof_floor_type || null,
       b.room_materials ? JSON.stringify(b.room_materials) : null, b.rules_and_regulations || null,
       b.allow_parents_friends !== false,
       b.nearby_landmarks ? JSON.stringify(b.nearby_landmarks) : null,
       b.locality, b.city, b.exact_address, b.lng, b.lat]
    );
    const [[created]] = await db.query('SELECT * FROM properties WHERE property_code = ?', [property_code]);
    res.status(201).json({ property: created });
  } catch (e) { next(e); }
}

// PATCH /api/v1/properties/:id/booking-status  (owner of the listing or admin)
async function setBookingStatus(req, res, next) {
  try {
    const { booking_status } = req.body;
    if (!['BOOKED', 'UNBOOKED'].includes(booking_status)) return res.status(400).json({ message: 'Invalid booking_status' });
    const [[prop]] = await db.query('SELECT owner_id FROM properties WHERE id = ?', [req.params.id]);
    if (!prop) return res.status(404).json({ message: 'Not found' });
    if (prop.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
    await db.query('UPDATE properties SET booking_status = ? WHERE id = ?', [booking_status, req.params.id]);
    res.json({ message: 'Updated', booking_status });
  } catch (e) { next(e); }
}

// DELETE /api/v1/properties/:id  (owner cannot delete VERIFIED listings; admin can, with audit log)
async function deleteProperty(req, res, next) {
  try {
    const [[prop]] = await db.query('SELECT owner_id, verification_status FROM properties WHERE id = ?', [req.params.id]);
    if (!prop) return res.status(404).json({ message: 'Not found' });
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = prop.owner_id === req.user.id;
    if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });
    if (prop.verification_status === 'VERIFIED' && !isAdmin) {
      return res.status(403).json({ message: 'Verified listings can only be deleted by Administration' });
    }
    await db.query('DELETE FROM properties WHERE id = ?', [req.params.id]);
    if (isAdmin) {
      await db.query(
        "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, 'DELETE_PROPERTY', 'PROPERTY', ?, ?)",
        [req.user.id, req.params.id, JSON.stringify({ reason: req.body?.reason || 'admin_delete' })]
      );
    }
    res.json({ message: 'Property deleted' });
  } catch (e) { next(e); }
}

// POST /api/v1/properties/:id/media  (owner; multer upload applied in route)
async function addMedia(req, res, next) {
  try {
    const [[prop]] = await db.query('SELECT owner_id FROM properties WHERE id = ?', [req.params.id]);
    if (!prop || prop.owner_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const { room_tag = 'EXTERIOR', captured_date, media_type = 'IMAGE', is_cover = false } = req.body;
    const file = req.file;
    const media_url = file ? `/uploads/${file.filename}` : req.body.media_url;
    if (!media_url) return res.status(400).json({ message: 'Provide an uploaded file or media_url' });
    await db.query(
      'INSERT INTO property_media (property_id, room_tag, media_type, media_url, captured_date, is_cover) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, room_tag, media_type, media_url, captured_date || new Date().toISOString().slice(0, 10), Boolean(is_cover)]
    );
    res.status(201).json({ message: 'Media added', media_url });
  } catch (e) { next(e); }
}

module.exports = { getProperty, myListings, createProperty, setBookingStatus, deleteProperty, addMedia };
