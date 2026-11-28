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

    // ওনার/লিস্টারকে স্ট্যাটাস আপডেট সম্পর্কে নোটিফিকেশন প্রদান
    const [[prop]] = await db.query('SELECT owner_id, title, property_code FROM properties WHERE id = ?', [req.params.id]);
    if (prop && prop.owner_id) {
      let notifType = 'PROPERTY_UNDER_REVIEW';
      let title = '🔍 Property Under Review';
      let msg = `Your property listing "${prop.title}" (${prop.property_code}) is currently under review by our Admin verification team.`;

      if (decision === 'VERIFIED') {
        notifType = 'PROPERTY_VERIFIED';
        title = '🎉 Property Verified & Live for Tenants!';
        msg = `Congratulations! Your property "${prop.title}" (${prop.property_code}) has been verified and published. Tenants can now view and book visits.`;
      } else if (decision === 'REJECTED') {
        notifType = 'PROPERTY_REJECTED';
        title = '❌ Property Listing Rejected';
        msg = `Your property listing "${prop.title}" (${prop.property_code}) could not be verified by Admin. Please check information and re-submit.`;
      }

      await dispatchUserStatusNotification(
        req.app.get('io'),
        prop.owner_id,
        'ACTIVE',
        0,
        null,
        notifType,
        title,
        msg
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('property_status_changed', { id: req.params.id, status: decision });
      io.emit('property_sync', { action: 'STATUS_CHANGED', id: req.params.id, status: decision });
    }

    res.json({ message: `Property status updated to ${decision.toLowerCase()}` });
  } catch (e) { next(e); }
}

// GET /api/v1/admin/properties/pending
async function pendingProperties(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.property_code, p.title, p.category, p.sub_type, p.rent_amount, p.advance_amount,
              p.locality, p.city, p.exact_address, p.verification_status, p.created_at,
              p.lister_type, p.furnishing_status, p.cover_url, p.photos, p.video_url, p.video_name,
              p.electricity_bill_url, p.electricity_bill_name, p.alternate_phone, p.rules_and_regulations,
              ST_Longitude(p.location) AS lng, ST_Latitude(p.location) AS lat,
              u.full_name AS owner_name, u.phone AS owner_phone, u.whatsapp_number AS owner_whatsapp, u.email AS owner_email, u.role AS owner_role
       FROM properties p JOIN users u ON u.id = p.owner_id
       WHERE p.verification_status IN ('PENDING', 'UNDER_REVIEW') ORDER BY p.created_at DESC`
    );
    res.json({ properties: rows });
  } catch (e) { next(e); }
}

// GET /api/v1/admin/users?role=TENANT|OWNER
async function listUsers(req, res, next) {
  try {
    const role = String(req.query.role || '').toUpperCase();
    let where = '';
    const params = [];

    // সেফটি সিঙ্ক: যদি কোনো ইউজার ইতোমধ্যে প্রপার্টি পোস্ট করে থাকেন কিন্তু তার রোল এখনও plain 'TENANT',
    // তবে তাকে স্বয়ংক্রিয়ভাবে 'TENANT+OWNER' হিসেবে রূপান্তর করা হবে।
    try {
      await db.query(`
        UPDATE users 
        SET role = 'TENANT+OWNER' 
        WHERE role = 'TENANT' 
          AND id IN (SELECT DISTINCT owner_id FROM properties)
      `);
    } catch {}

    if (role === 'OWNER') {
      // ওনার সেকশন: পিওর ওনার, বিল্ডার এবং যেসকল টেন্যান্ট প্রপার্টি পোস্ট করেছে (TENANT+OWNER, TENANT+BUILDER)
      where = `WHERE (
        role IN ('OWNER', 'BUILDER', 'TENANT+OWNER', 'TENANT+BUILDER') 
        OR role LIKE '%OWNER%' 
        OR role LIKE '%BUILDER%' 
        OR id IN (SELECT DISTINCT owner_id FROM properties)
      )`;
    } else if (role === 'TENANT') {
      // টেন্যান্ট সেকশন: কেবলমাত্র পিওর টেন্যান্ট যারা কোনো প্রপার্টি পোস্ট করেনি
      where = `WHERE (
        role = 'TENANT' 
        AND role NOT LIKE '%OWNER%' 
        AND role NOT LIKE '%BUILDER%' 
        AND id NOT IN (SELECT DISTINCT owner_id FROM properties)
      )`;
    } else if (role === 'ADMIN') {
      where = "WHERE role = 'ADMIN'";
    }

    const [rows] = await db.query(
      `SELECT id, full_name, email, phone, role, verification_status, account_status,
              strike_count, block_reason, unblock_appeal_status, unblock_appeal_text, unblock_appeal_date,
              average_rating, created_at,
              (SELECT COUNT(*) FROM properties p WHERE p.owner_id = users.id) AS property_count
       FROM users ${where} ORDER BY created_at DESC LIMIT 500`,
      params
    );

    for (const u of rows) {
      if (Number(u.property_count || 0) > 0 && u.role === 'TENANT') {
        u.role = 'TENANT+OWNER';
      }
    }

    res.json({ users: rows });
  } catch (e) { next(e); }
}

// GET /api/v1/admin/users/:id/activity
async function getUserActivity(req, res, next) {
  try {
    const userId = req.params.id;
    const [[user]] = await db.query(
      `SELECT id, full_name, email, phone, whatsapp_number, role, tenant_gender, tenant_occupation,
              verification_status, account_status, strike_count, block_reason,
              unblock_appeal_status, unblock_appeal_text, unblock_appeal_date,
              average_rating, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ১. এই ইউজারের পোস্ট করা সমস্ত প্রপার্টি (রুম/ফ্ল্যাট)
    const [properties] = await db.query(
      `SELECT id, property_code, title, category, sub_type, rent_amount, advance_amount,
              locality, city, exact_address, booking_status, verification_status,
              lister_type, furnishing_status, cover_url, photos, video_url, video_name,
              electricity_bill_url, electricity_bill_name, alternate_phone,
              rules_and_regulations, created_at,
              ST_Longitude(location) AS lng, ST_Latitude(location) AS lat
       FROM properties WHERE owner_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    // ২. এই টেন্যান্টের বুক করা সমস্ত ভিজিট
    const [visitsBooked] = await db.query(
      `SELECT v.id, v.property_id, v.visit_date, v.time_window, v.time_slot, v.status, v.created_at,
              p.title AS property_title, p.locality, p.city, p.property_code,
              o.full_name AS owner_name, o.phone AS owner_phone
       FROM visit_bookings v
       JOIN properties p ON p.id = v.property_id
       JOIN users o ON o.id = v.owner_id
       WHERE v.tenant_id = ?
       ORDER BY v.created_at DESC`,
      [userId]
    );

    // ৩. ওনার হিসেবে এই ইউজারের প্রপার্টিতে আসা সমস্ত ভিজিট রিকোয়েস্ট
    const [visitsReceived] = await db.query(
      `SELECT v.id, v.property_id, v.visit_date, v.time_window, v.time_slot, v.status, v.created_at,
              p.title AS property_title, p.property_code,
              t.full_name AS tenant_name, t.phone AS tenant_phone, t.email AS tenant_email
       FROM visit_bookings v
       JOIN properties p ON p.id = v.property_id
       JOIN users t ON t.id = v.tenant_id
       WHERE v.owner_id = ?
       ORDER BY v.created_at DESC`,
      [userId]
    );

    // ৪. টেন্যান্ট হিসেবে এই ইউজারের করা সমস্ত পেমেন্ট (কতো বার পেমেন্ট করেছে ও বিস্তারিত)
    const [paymentsMade] = await db.query(
      `SELECT py.id, py.property_id, py.amount, py.payment_method, py.gateway_order_id,
              py.gateway_txn_id, py.status, py.created_at,
              p.title AS property_title, p.property_code, p.category,
              o.full_name AS owner_name, o.phone AS owner_phone
       FROM payments py
       JOIN properties p ON p.id = py.property_id
       JOIN users o ON o.id = p.owner_id
       WHERE py.payer_id = ?
       ORDER BY py.created_at DESC`,
      [userId]
    );

    // ৫. ওনার হিসেবে প্রপার্টির বিপরীতে গৃহীত সমস্ত পেমেন্ট ট্রানজ্যাকশন
    const [paymentsReceived] = await db.query(
      `SELECT py.id, py.property_id, py.amount, py.payment_method, py.gateway_order_id,
              py.gateway_txn_id, py.status, py.created_at,
              p.title AS property_title, p.property_code,
              t.full_name AS tenant_name, t.phone AS tenant_phone, t.email AS tenant_email
       FROM payments py
       JOIN properties p ON p.id = py.property_id
       JOIN users t ON t.id = py.payer_id
       WHERE p.owner_id = ?
       ORDER BY py.created_at DESC`,
      [userId]
    );

    // ৬. নোটিফিকেশন হিস্টোরি
    const [notifications] = await db.query(
      `SELECT id, type, title, message, is_read, created_at
       FROM user_notifications
       WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 25`,
      [userId]
    );

    res.json({
      user,
      properties,
      visitsBooked,
      visitsReceived,
      paymentsMade,
      paymentsReceived,
      notifications,
    });
  } catch (e) {
    next(e);
  }
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

// GET /api/v1/admin/properties  (all properties with filters: status, booking_status, search)
async function listAllProperties(req, res, next) {
  try {
    const { status, booking_status, search } = req.query;
    const where = ['1=1'];
    const params = [];

    if (status && status !== 'ALL') {
      where.push('p.verification_status = ?');
      params.push(status);
    }
    if (booking_status && booking_status !== 'ALL') {
      where.push('p.booking_status = ?');
      params.push(booking_status);
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where.push('(p.property_code LIKE ? OR p.title LIKE ? OR p.locality LIKE ? OR p.city LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?)');
      params.push(q, q, q, q, q, q);
    }

    const [rows] = await db.query(
      `SELECT p.id, p.property_code, p.owner_id, p.title, p.category, p.sub_type, p.allowed_gender,
              p.allowed_tenant_type, p.room_sharing_capacity, p.bathroom_type, p.kitchen_available,
              p.food_included, p.rent_amount, p.advance_amount, p.contract_months,
              p.water_bill_included, p.electricity_bill_included, p.size_sqft, p.roof_floor_type,
              p.room_materials, p.rules_and_regulations, p.allow_parents_friends, p.nearby_landmarks,
              p.locality, p.city, p.exact_address, p.booking_status, p.verification_status,
              p.lister_type, p.furnishing_status, p.cover_url, p.photos, p.video_url, p.video_name,
              p.electricity_bill_url, p.electricity_bill_name, p.alternate_phone, p.created_at,
              ST_Longitude(p.location) AS lng, ST_Latitude(p.location) AS lat,
              u.full_name AS owner_name, u.phone AS owner_phone, u.whatsapp_number AS owner_whatsapp,
              u.email AS owner_email, u.role AS owner_role
       FROM properties p
       JOIN users u ON u.id = p.owner_id
       WHERE ${where.join(' AND ')}
       ORDER BY p.created_at DESC`,
      params
    );

    const parsed = rows.map((r) => {
      let photos = [];
      try {
        photos = typeof r.photos === 'string' ? JSON.parse(r.photos) : (Array.isArray(r.photos) ? r.photos : []);
      } catch { photos = []; }
      return {
        ...r,
        photos,
        location: [r.locality, r.city].filter(Boolean).join(', ') || 'Kolkata',
      };
    });

    res.json({ properties: parsed, count: parsed.length });
  } catch (e) { next(e); }
}

// PATCH /api/v1/admin/properties/:id/booking  { booking_status: 'BOOKED'|'UNBOOKED' }
async function adminUpdateBookingStatus(req, res, next) {
  try {
    const { booking_status } = req.body;
    if (!['BOOKED', 'UNBOOKED'].includes(booking_status)) {
      return res.status(400).json({ message: 'booking_status must be BOOKED or UNBOOKED' });
    }

    await db.query('UPDATE properties SET booking_status = ? WHERE id = ?', [booking_status, req.params.id]);

    const [[prop]] = await db.query('SELECT id, title, property_code, owner_id FROM properties WHERE id = ?', [req.params.id]);
    if (prop && prop.owner_id) {
      const title = '🏠 Property Booking Status Updated';
      const msg = booking_status === 'BOOKED'
        ? `Your property "${prop.title}" (${prop.property_code}) has been marked as BOOKED by Admin.`
        : `Your property "${prop.title}" (${prop.property_code}) has been marked as UNBOOKED (Available) by Admin.`;

      await dispatchUserStatusNotification(
        req.app.get('io'),
        prop.owner_id,
        'ACTIVE',
        0,
        null,
        'PROPERTY_BOOKING_UPDATED',
        title,
        msg
      );
    }

    res.json({ message: `Booking status updated to ${booking_status}`, booking_status, property_id: req.params.id });
  } catch (e) { next(e); }
}

// PUT /api/v1/admin/properties/:id  (admin modifies property details)
async function adminUpdateProperty(req, res, next) {
  try {
    const b = req.body;
    const title = (b.title || '').trim();
    const rent_amount = Number(b.rent_amount || b.price || 0);
    const advance_amount = Number(b.advance_amount || b.deposit || 0);
    const locality = (b.locality || '').trim();
    const city = (b.city || 'Kolkata').trim();
    const exact_address = (b.exact_address || '').trim();

    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!rent_amount || rent_amount <= 0) return res.status(400).json({ message: 'Valid rent amount is required' });

    await db.query(
      `UPDATE properties
       SET title = ?, category = ?, sub_type = ?, rent_amount = ?, advance_amount = ?,
           locality = ?, city = ?, exact_address = ?, allowed_gender = ?, allowed_tenant_type = ?,
           room_sharing_capacity = ?, rules_and_regulations = ?, furnishing_status = ?
       WHERE id = ?`,
      [
        title,
        b.category || 'FLAT',
        b.sub_type || b.subtype || '2 BHK',
        rent_amount,
        advance_amount,
        locality,
        city,
        exact_address,
        b.allowed_gender || 'ANY',
        b.allowed_tenant_type || 'ANY',
        Number(b.room_sharing_capacity || 1),
        b.rules_and_regulations || null,
        b.furnishing_status || 'SEMI_FURNISHED',
        req.params.id,
      ]
    );

    const [[updated]] = await db.query(
      `SELECT p.*, ST_Longitude(p.location) AS lng, ST_Latitude(p.location) AS lat,
              u.full_name AS owner_name, u.phone AS owner_phone, u.email AS owner_email
       FROM properties p
       JOIN users u ON u.id = p.owner_id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (updated && updated.owner_id) {
      await dispatchUserStatusNotification(
        req.app.get('io'),
        updated.owner_id,
        'ACTIVE',
        0,
        null,
        'PROPERTY_MODIFIED',
        '✏️ Property Details Updated by Admin',
        `Admin has updated the details for your property "${updated.title}" (${updated.property_code}). View updated terms in My Properties.`
      );
    }

    res.json({ message: 'Property details updated successfully', property: updated });
  } catch (e) { next(e); }
}

// DELETE /api/v1/admin/properties/:id  (admin deletes property)
async function adminDeleteProperty(req, res, next) {
  try {
    const [[prop]] = await db.query('SELECT id, title, property_code, owner_id FROM properties WHERE id = ?', [req.params.id]);
    if (!prop) return res.status(404).json({ message: 'Property not found' });

    // Clean up dependent tables if needed
    try { await db.query('DELETE FROM property_media WHERE property_id = ?', [req.params.id]); } catch {}
    try { await db.query('DELETE FROM visits WHERE property_id = ?', [req.params.id]); } catch {}
    try { await db.query('DELETE FROM ratings WHERE property_id = ?', [req.params.id]); } catch {}
    try { await db.query('DELETE FROM properties WHERE id = ?', [req.params.id]); } catch {}

    if (prop.owner_id) {
      await dispatchUserStatusNotification(
        req.app.get('io'),
        prop.owner_id,
        'ACTIVE',
        0,
        null,
        'PROPERTY_DELETED',
        '🗑️ Property Listing Deleted by Admin',
        `Your property listing "${prop.title}" (${prop.property_code}) was removed by Admin.`
      );
    }

    res.json({ message: 'Property deleted successfully', id: req.params.id });
  } catch (e) { next(e); }
}

module.exports = {
  faceVerify, verificationQueue, reviewOwnerVerification, verifyProperty, pendingProperties,
  listUsers, getUserActivity, setUserStatus, permanentDeleteUser, revenue, createReport, reportQueue, resolveReport,
  listAllProperties, adminUpdateBookingStatus, adminUpdateProperty, adminDeleteProperty,
};
