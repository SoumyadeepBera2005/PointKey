const axios = require('axios');
const db = require('../config/db');

// POST /api/v1/owner/face-verify  (multipart: id_card_image, live_selfie; id_card_type)
// Forwards to the Python AI microservice; records the verification request.
async function faceVerify(req, res, next) {
  try {
    const files = req.files || {};
    const idCard = files.id_card_image?.[0];
    const selfie = files.live_selfie?.[0];
    if (!idCard || !selfie) return res.status(400).json({ message: 'Both id_card_image and live_selfie files are required' });

    const FormData = require('form-data');
    const fs = require('fs');
    const form = new FormData();
    form.append('id_card_image', fs.createReadStream(idCard.path));
    form.append('live_selfie', fs.createReadStream(selfie.path));

    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    let aiResult = { ai_match_score: null, liveness_passed: false, status: 'PENDING', detail: 'AI service unreachable — queued for manual admin review' };
    try {
      const { data } = await axios.post(`${aiUrl}/verify-owner-face`, form, {
        headers: form.getHeaders(), timeout: 60000, maxBodyLength: 100 * 1024 * 1024,
      });
      aiResult = data;
    } catch (e) {
      console.warn('AI service error:', e.message);
    }

    await db.query(
      `INSERT INTO owner_verifications (id, owner_id, id_card_type, id_card_image_url, live_selfie_url, ai_match_score, liveness_passed, status)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [req.user.id, req.body.id_card_type || 'GOVT_ID',
       `/uploads/${idCard.filename}`, `/uploads/${selfie.filename}`,
       aiResult.ai_match_score ?? null, Boolean(aiResult.liveness_passed)]
    );
    await db.query("UPDATE users SET verification_status = 'PENDING' WHERE id = ?", [req.user.id]);
    res.json({ message: 'Verification submitted for admin review', ai: aiResult });
  } catch (e) { next(e); }
}

// ---------- Admin endpoints ----------

// GET /api/v1/admin/verification-queue
async function verificationQueue(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT v.*, u.full_name, u.email, u.phone FROM owner_verifications v
       JOIN users u ON u.id = v.owner_id
       WHERE v.status = 'PENDING' ORDER BY v.created_at ASC`
    );
    res.json({ queue: rows });
  } catch (e) { next(e); }
}

// POST /api/v1/admin/owner-verifications/:id/review  { decision: VERIFIED|REJECTED, rejection_reason? }
async function reviewOwnerVerification(req, res, next) {
  try {
    const { decision, rejection_reason } = req.body;
    if (!['VERIFIED', 'REJECTED'].includes(decision)) return res.status(400).json({ message: 'decision must be VERIFIED or REJECTED' });
    const [[v]] = await db.query('SELECT * FROM owner_verifications WHERE id = ?', [req.params.id]);
    if (!v) return res.status(404).json({ message: 'Verification not found' });

    await db.query(
      'UPDATE owner_verifications SET status = ?, rejection_reason = ?, admin_reviewer_id = ? WHERE id = ?',
      [decision, rejection_reason || null, req.user.id, req.params.id]
    );
    await db.query('UPDATE users SET verification_status = ? WHERE id = ?', [decision, v.owner_id]);
    res.json({ message: `Owner ${decision.toLowerCase()}` });
  } catch (e) { next(e); }
}

// POST /api/v1/admin/properties/:id/verify  { decision: VERIFIED|REJECTED }
async function verifyProperty(req, res, next) {
  try {
    const { decision } = req.body;
    if (!['VERIFIED', 'REJECTED'].includes(decision)) return res.status(400).json({ message: 'decision must be VERIFIED or REJECTED' });
    await db.query('UPDATE properties SET verification_status = ? WHERE id = ?', [decision, req.params.id]);
    res.json({ message: `Property ${decision.toLowerCase()}` });
  } catch (e) { next(e); }
}

// GET /api/v1/admin/properties/pending
async function pendingProperties(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.property_code, p.title, p.category, p.rent_amount, p.created_at, u.full_name AS owner_name
       FROM properties p JOIN users u ON u.id = p.owner_id
       WHERE p.verification_status = 'PENDING' ORDER BY p.created_at ASC`
    );
    res.json({ properties: rows });
  } catch (e) { next(e); }
}

// GET /api/v1/admin/users?role=TENANT|OWNER
async function listUsers(req, res, next) {
  try {
    const role = String(req.query.role || '').toUpperCase();
    const where = role && ['TENANT', 'OWNER', 'ADMIN'].includes(role) ? 'WHERE role = ?' : '';
    const params = where ? [role] : [];
    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role, verification_status, account_status, average_rating, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT 500`,
      params
    );
    res.json({ users: rows });
  } catch (e) { next(e); }
}

// PATCH /api/v1/admin/users/:id/status  { account_status: ACTIVE|BLOCKED|DELETED }
async function setUserStatus(req, res, next) {
  try {
    const { account_status } = req.body;
    if (!['ACTIVE', 'BLOCKED', 'DELETED'].includes(account_status)) return res.status(400).json({ message: 'Invalid account_status' });
    await db.query('UPDATE users SET account_status = ? WHERE id = ?', [account_status, req.params.id]);
    await db.query(
      "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, 'USER', ?, ?)",
      [req.user.id, `SET_${account_status}`, req.params.id, JSON.stringify({ account_status })]
    );
    res.json({ message: `User ${account_status.toLowerCase()}` });
  } catch (e) { next(e); }
}

// DELETE /api/v1/admin/users/:id/permanent
// Irreversible hard delete — removes the user row from the database.
// All dependent rows (properties, visits, payments, ratings, reports,
// chat_messages, verifications) are removed via ON DELETE CASCADE.
// Guards: ADMIN accounts and the requesting admin themself cannot be deleted here.
async function permanentDeleteUser(req, res, next) {
  let conn;
  try {
    conn = await db.getConnection();
    const [[user]] = await conn.query('SELECT id, full_name, email, phone, role FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(403).json({ message: 'Admin accounts cannot be deleted here' });
    if (user.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });

    await conn.beginTransaction();
    await conn.query(
      "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, 'PERMANENT_DELETE', 'USER', ?, ?)",
      [req.user.id, user.id, JSON.stringify({ full_name: user.full_name, email: user.email, phone: user.phone, role: user.role })]
    );
    await conn.query('DELETE FROM users WHERE id = ?', [user.id]);
    await conn.commit();
    res.json({ message: 'User and all associated data permanently deleted' });
  } catch (e) {
    try { if (conn) await conn.rollback(); } catch { /* connection may be dead */ }
    next(e);
  } finally {
    if (conn) conn.release();
  }
}

// GET /api/v1/admin/revenue?months=6
async function revenue(req, res, next) {
  try {
    const months = Math.min(Number(req.query.months) || 6, 24);
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(amount) AS revenue, COUNT(*) AS transactions
       FROM payments WHERE status IN ('SUCCESS','REFUNDED') AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC`,
      [months]
    );
    const [[totals]] = await db.query(
      `SELECT COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0) AS gross,
              COALESCE(SUM(CASE WHEN status = 'REFUNDED' THEN amount ELSE 0 END), 0) AS refunded,
              COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) AS successful_transactions
       FROM payments`
    );
    res.json({ monthly: rows, totals });
  } catch (e) { next(e); }
}

// POST /api/v1/reports  { type, description, target_user_id?, target_property_id? }
async function createReport(req, res, next) {
  try {
    const { type, description, target_user_id, target_property_id } = req.body;
    if (!['SCAM', 'REPORT', 'HELP_REQUEST', 'REFUND_DISPUTE'].includes(type)) return res.status(400).json({ message: 'Invalid type' });
    if (!description) return res.status(400).json({ message: 'description is required' });
    await db.query(
      'INSERT INTO reports_and_tickets (id, reporter_id, target_user_id, target_property_id, type, description) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [req.user.id, target_user_id || null, target_property_id || null, type, description]
    );
    res.status(201).json({ message: 'Report submitted — our team will review it' });
  } catch (e) { next(e); }
}

// GET /api/v1/admin/reports
async function reportQueue(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.full_name AS reporter_name FROM reports_and_tickets r
       JOIN users u ON u.id = r.reporter_id ORDER BY FIELD(r.status,'OPEN','IN_REVIEW','RESOLVED','BLOCKED'), r.created_at DESC`
    );
    res.json({ reports: rows });
  } catch (e) { next(e); }
}

// PATCH /api/v1/admin/reports/:id  { status, admin_notes? }
async function resolveReport(req, res, next) {
  try {
    const { status, admin_notes } = req.body;
    if (!['OPEN', 'IN_REVIEW', 'RESOLVED', 'BLOCKED'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    await db.query('UPDATE reports_and_tickets SET status = ?, admin_notes = ? WHERE id = ?', [status, admin_notes || null, req.params.id]);
    res.json({ message: 'Report updated' });
  } catch (e) { next(e); }
}

module.exports = {
  faceVerify, verificationQueue, reviewOwnerVerification, verifyProperty, pendingProperties,
  listUsers, setUserStatus, permanentDeleteUser, revenue, createReport, reportQueue, resolveReport,
};
