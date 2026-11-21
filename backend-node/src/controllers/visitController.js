const db = require('../config/db');

const VALID_SLOTS = ['10:00-11:00 AM', '11:00-12:00 PM', '3:00-4:00 PM', '4:00-5:00 PM', '7:00-8:00 PM', '8:00-9:00 PM'];
const SLOT_WINDOW = {
  '10:00-11:00 AM': 'MID_MORNING', '11:00-12:00 PM': 'MID_MORNING',
  '3:00-4:00 PM': 'AFTERNOON', '4:00-5:00 PM': 'AFTERNOON',
  '7:00-8:00 PM': 'EVENING', '8:00-9:00 PM': 'EVENING',
};

/**
 * POST /api/v1/visits/request  { property_id, visit_date, time_slot }
 * Requires a SUCCESS payment for the property. Locks the slot per property/date.
 */
async function requestVisit(req, res, next) {
  const conn = await db.getConnection();
  try {
    const { property_id, visit_date, time_slot } = req.body;
    if (!property_id || !visit_date || !VALID_SLOTS.includes(time_slot)) {
      return res.status(400).json({ message: `property_id, visit_date and a valid time_slot are required. Slots: ${VALID_SLOTS.join(', ')}` });
    }
    const [[payment]] = await conn.query(
      "SELECT id FROM payments WHERE payer_id = ? AND property_id = ? AND status IN ('SUCCESS','REFUND_REQUESTED') LIMIT 1",
      [req.user.id, property_id]
    );
    if (!payment) return res.status(403).json({ message: 'Unlock the property (payment) before booking a visit' });

    const [[property]] = await conn.query('SELECT owner_id, title FROM properties WHERE id = ?', [property_id]);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    await conn.beginTransaction();
    // Slot conflict prevention: lock active bookings for this property+date+slot
    const [active] = await conn.query(
      "SELECT id FROM visit_bookings WHERE property_id = ? AND visit_date = ? AND time_slot = ? AND status IN ('REQUESTED','CONFIRMED','RESCHEDULED') FOR UPDATE",
      [property_id, visit_date, time_slot]
    );
    if (active.length) {
      await conn.rollback();
      return res.status(409).json({ message: 'This slot is already booked for that date' });
    }
    await conn.query(
      `INSERT INTO visit_bookings (id, property_id, tenant_id, owner_id, payment_id, visit_date, time_window, time_slot, status)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'REQUESTED')`,
      [property_id, req.user.id, property.owner_id, payment.id, visit_date, SLOT_WINDOW[time_slot], time_slot]
    );
    await conn.commit();
    res.status(201).json({ message: 'Visit requested — awaiting owner confirmation', time_slot, visit_date });
  } catch (e) {
    try { await conn.rollback(); } catch { /* noop */ }
    next(e);
  } finally {
    conn.release();
  }
}

// GET /api/v1/visits/mine  (tenant)
async function myVisits(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT v.*, p.title AS property_title, p.property_code FROM visit_bookings v
       JOIN properties p ON p.id = v.property_id WHERE v.tenant_id = ? ORDER BY v.visit_date DESC`,
      [req.user.id]
    );
    res.json({ visits: rows });
  } catch (e) { next(e); }
}

// GET /api/v1/visits/owner-requests  (owner)
async function ownerRequests(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT v.*, p.title AS property_title, p.property_code, u.full_name AS tenant_name, u.phone AS tenant_phone, u.average_rating AS tenant_rating
       FROM visit_bookings v
       JOIN properties p ON p.id = v.property_id
       JOIN users u ON u.id = v.tenant_id
       WHERE v.owner_id = ? ORDER BY v.visit_date DESC, v.created_at DESC`,
      [req.user.id]
    );
    res.json({ requests: rows });
  } catch (e) { next(e); }
}

// PATCH /api/v1/visits/:id/status  { status: CONFIRMED|RESCHEDULED|COMPLETED|CANCELLED, visit_date?, time_slot? }
async function updateVisitStatus(req, res, next) {
  try {
    const { status, visit_date, time_slot } = req.body;
    if (!['CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [[visit]] = await db.query('SELECT * FROM visit_bookings WHERE id = ?', [req.params.id]);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });
    const isOwner = visit.owner_id === req.user.id;
    const isTenant = visit.tenant_id === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isTenant && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    if (status === 'RESCHEDULED') {
      if (time_slot && !VALID_SLOTS.includes(time_slot)) return res.status(400).json({ message: 'Invalid time_slot' });
      await db.query(
        'UPDATE visit_bookings SET status = ?, visit_date = COALESCE(?, visit_date), time_slot = COALESCE(?, time_slot), time_window = COALESCE(?, time_window) WHERE id = ?',
        ['RESCHEDULED', visit_date || null, time_slot || null, time_slot ? SLOT_WINDOW[time_slot] : null, req.params.id]
      );
    } else {
      await db.query('UPDATE visit_bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    }
    res.json({ message: `Visit ${status.toLowerCase()}` });
  } catch (e) { next(e); }
}

// GET /api/v1/visits/history/:propertyId  (owner)
async function visitHistory(req, res, next) {
  try {
    const [[prop]] = await db.query('SELECT owner_id FROM properties WHERE id = ?', [req.params.propertyId]);
    if (!prop || (prop.owner_id !== req.user.id && req.user.role !== 'ADMIN')) return res.status(403).json({ message: 'Forbidden' });
    const [rows] = await db.query(
      `SELECT v.*, u.full_name AS tenant_name FROM visit_bookings v JOIN users u ON u.id = v.tenant_id
       WHERE v.property_id = ? ORDER BY v.created_at DESC`,
      [req.params.propertyId]
    );
    res.json({ history: rows });
  } catch (e) { next(e); }
}

module.exports = { requestVisit, myVisits, ownerRequests, updateVisitStatus, visitHistory, VALID_SLOTS };
