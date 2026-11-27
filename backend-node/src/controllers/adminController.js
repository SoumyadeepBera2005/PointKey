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

// POST /api/v1/admin/properties/:id/verify  { decision: VERIFIED|REJECTED|UNDER_REVIEW }
async function verifyProperty(req, res, next) {
  try {
    const { decision } = req.body;
    if (!['VERIFIED', 'REJECTED', 'UNDER_REVIEW'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be VERIFIED, REJECTED, or UNDER_REVIEW' });
    }
    await db.query('UPDATE properties SET verification_status = ? WHERE id = ?', [decision, req.params.id]);
    res.json({ message: `Property status updated to ${decision.toLowerCase()}` });
  } catch (e) { next(e); }
}

// GET /api/v1/admin/properties/pending
async function pendingProperties(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.property_code, p.title, p.category, p.rent_amount, p.created_at, p.verification_status, u.full_name AS owner_name
       FROM properties p JOIN users u ON u.id = p.owner_id
       WHERE p.verification_status IN ('PENDING', 'UNDER_REVIEW') ORDER BY p.created_at ASC`
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
      `SELECT id, full_name, email, phone, role, verification_status, account_status,
              strike_count, block_reason, unblock_appeal_status, unblock_appeal_text, unblock_appeal_date,
              average_rating, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT 500`,
      params
    );
    res.json({ users: rows });
  } catch (e) { next(e); }
}

/**
 * নোটিফিকেশন ডিসপ্যাচার ও রিয়েল-টাইম সকেট ইমিটার:
 * এডমিন কোনো ইউজারকে ব্লক, সাসপেন্ড বা অ্যাপ্রুভ করার সাথে সাথে:
 * ১. ডাটাবেসে ইউজার নোটিফিকেশন এন্ট্রি সেভ হয়।
 * ২. Socket.io এর মাধ্যমে ব্যবহারকারীর ডিভাইসে রিয়েল-টাইম নোটিফিকেশন চলে যায়।
 */
async function dispatchUserStatusNotification(io, userId, status, strike, reason, type, title, message) {
  try {
    const notifId = require('crypto').randomUUID();
    await db.query(
      'INSERT INTO user_notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
      [notifId, userId, type, title, message]
    );
    if (io) {
      const payload = {
        userId,
        account_status: status,
        strike_count: strike,
        block_reason: reason,
        notification: {
          id: notifId,
          user_id: userId,
          type,
          title,
          message,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      };
      io.to(`user:${userId}`).emit('account_status_changed', payload);
      io.to(`user:${userId}`).emit('new_notification', payload.notification);
      io.emit('user_status_sync', payload);
    }
  } catch (err) {
    console.error('[Notification Dispatch Error]:', err.message);
  }
}

/**
 * PATCH /api/v1/admin/users/:id/status
 * =============================================================================
 * এডমিন কর্তৃক ম্যানুয়াল ২-স্ট্রাইক ও আপিল ম্যানেজমেন্ট সিস্টেম:
 * ১. Strike 1 (SUSPENDED): সাময়িক স্থগিতাদেশ। সাথে সাথে নোটিফিকেশন পাঠানো হয়।
 * ২. Appeal Review (APPROVE/REJECT): ইউজার অঙ্গীকারনামা জমা দিলে এডমিন তা রিভিউ করে
 *    - অ্যাপ্রুভ করলে অ্যাকাউন্ট পুনরায় ACTIVE হবে এবং নোটিফিকেশন যাবে।
 *    - রিজেক্ট করলে SUSPENDED থাকবে এবং নোটিফিকেশন যাবে।
 * ৩. Strike 2 (BLOCKED): দ্বিতীয়বার নিয়ম ভাঙলে স্থায়ীভাবে পার্মানেন্ট ব্লক।
 * ৪. সম্পূর্ণ ম্যানুয়াল নিয়ন্ত্রণ — এডমিন সম্পূর্ণ বিচার বিবেচনা করে সিদ্ধান্ত নেন।
 * =============================================================================
 */
async function setUserStatus(req, res, next) {
  try {
    const { account_status, reason, strike_count, appeal_decision } = req.body;
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED'];
    const io = req.app?.get('io');

    const [[targetUser]] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.role === 'ADMIN') return res.status(403).json({ message: 'Cannot modify admin account status' });

    // ১. এডমিন আপিল পর্যালোচনা (Review Unblock Appeal)
    if (appeal_decision === 'APPROVE') {
      await db.query(
        `UPDATE users 
         SET account_status = 'ACTIVE', 
             unblock_appeal_status = 'APPROVED'
         WHERE id = ?`,
        [req.params.id]
      );
      await db.query(
        "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, 'APPROVE_UNBLOCK_APPEAL', 'USER', ?, ?)",
        [req.user.id, req.params.id, JSON.stringify({ previous_status: targetUser.account_status, strike_count: targetUser.strike_count })]
      );

      // তাৎক্ষণিক নোটিফিকেশন ও সকেট ডিসপ্যাচ
      await dispatchUserStatusNotification(
        io,
        req.params.id,
        'ACTIVE',
        targetUser.strike_count,
        null,
        'APPEAL_APPROVED',
        '✅ Unblock Appeal Approved',
        'PointKey Admin has approved your signed rules undertaking. Your account access has been fully restored!'
      );

      return res.json({ message: 'Appeal approved! User access has been fully restored (Strike 1 remains recorded).' });
    }

    if (appeal_decision === 'REJECT') {
      await db.query(
        `UPDATE users 
         SET unblock_appeal_status = 'REJECTED' 
         WHERE id = ?`,
        [req.params.id]
      );
      await db.query(
        "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, 'REJECT_UNBLOCK_APPEAL', 'USER', ?, ?)",
        [req.user.id, req.params.id, JSON.stringify({ reason: reason || 'Appeal rejected by admin' })]
      );

      await dispatchUserStatusNotification(
        io,
        req.params.id,
        'SUSPENDED',
        targetUser.strike_count,
        reason,
        'APPEAL_REJECTED',
        '❌ Unblock Appeal Rejected',
        'Your unblock appeal was rejected by Admin. Please submit an updated pledge statement via NestAI.'
      );

      return res.json({ message: 'Appeal rejected. User remains suspended.' });
    }

    // ২. এডমিন সরাসরি স্ট্যাটাস বা স্ট্রাইক পরিবর্তন করছেন
    const nextStatus = account_status ? String(account_status).toUpperCase() : targetUser.account_status;
    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid account_status. Must be ACTIVE, SUSPENDED, BLOCKED, or DELETED' });
    }

    let newStrike = strike_count !== undefined ? Number(strike_count) : Number(targetUser.strike_count || 0);
    let newReason = reason !== undefined ? reason : targetUser.block_reason;
    let newAppealStatus = targetUser.unblock_appeal_status;

    if (nextStatus === 'SUSPENDED') {
      newStrike = 1; // Strike 1
      newAppealStatus = 'NONE';
      if (!newReason) newReason = 'Rule violation (Strike 1)';
    } else if (nextStatus === 'BLOCKED') {
      newStrike = 2; // Strike 2 (Permanent ban)
      newAppealStatus = 'NONE';
      if (!newReason) newReason = 'Repeated rule violations (Strike 2)';
    } else if (nextStatus === 'ACTIVE') {
      newAppealStatus = 'NONE';
      if (strike_count !== undefined) {
        newStrike = Number(strike_count);
      }
    }

    await db.query(
      `UPDATE users 
       SET account_status = ?, 
           strike_count = ?, 
           block_reason = ?, 
           unblock_appeal_status = ? 
       WHERE id = ?`,
      [nextStatus, newStrike, newReason || null, newAppealStatus, req.params.id]
    );

    await db.query(
      "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, 'USER', ?, ?)",
      [req.user.id, `SET_${nextStatus}`, req.params.id, JSON.stringify({ nextStatus, strike_count: newStrike, reason: newReason })]
    );

    // ব্লক বা সাসপেনশন বা অ্যাক্টিভেশনের সাথে সাথে ইউজারের ডিভাইসে নোটিফিকেশন পাঠানো
    if (nextStatus === 'BLOCKED') {
      await dispatchUserStatusNotification(
        io,
        req.params.id,
        'BLOCKED',
        newStrike,
        newReason,
        'ACCOUNT_BLOCKED',
        '⛔ Account Permanently Blocked (Strike 2)',
        `Admin has permanently blocked your account for rule violation: "${newReason}". All platform access is terminated.`
      );
    } else if (nextStatus === 'SUSPENDED') {
      await dispatchUserStatusNotification(
        io,
        req.params.id,
        'SUSPENDED',
        newStrike,
        newReason,
        'ACCOUNT_SUSPENDED',
        '⚠️ Account Suspended by Admin (Strike 1)',
        `Your account was suspended by Admin for: "${newReason}". View Details and payments are disabled. Open NestAI to appeal.`
      );
    } else if (nextStatus === 'ACTIVE') {
      await dispatchUserStatusNotification(
        io,
        req.params.id,
        'ACTIVE',
        newStrike,
        null,
        'ACCOUNT_RESTORED',
        '✅ Account Restored to Active',
        'Admin has restored your account to Active status. All features are now unlocked!'
      );
    }

    res.json({ message: `User status updated to ${nextStatus.toLowerCase()}` });
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
