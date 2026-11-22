const jwt = require('jsonwebtoken');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'change_me_super_secret',
    { expiresIn: '7d' }
  );
}

/**
 * সেন্ট্রাল অথেনটিকেশন মিডলওয়্যার (authMiddleware):
 * টোকেন ভ্যালিডেট করার পাশাপাশি ডাটাবেস থেকে ইউজারের রিয়েল-টাইম স্ট্যাটাস
 * (account_status, strike_count, block_reason, unblock_appeal_status) ফেচ করে
 * req.user-এ যুক্ত করে। ফলে এডমিন কোনো ইউজারকে সাসপেন্ড বা ব্লক করলে সাথে সাথে
 * তা ব্যাকএন্ডের পরবর্তী রিকোয়েস্টে কার্যকর হয়।
 */
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change_me_super_secret');
    try {
      const db = require('../config/db');
      const [[u]] = await db.query(
        'SELECT account_status, strike_count, unblock_appeal_status, block_reason FROM users WHERE id = ?',
        [req.user.id]
      );
      if (u) {
        req.user.account_status = u.account_status;
        req.user.strike_count = Number(u.strike_count || 0);
        req.user.unblock_appeal_status = u.unblock_appeal_status;
        req.user.block_reason = u.block_reason;
      }
    } catch {
      // ডাটাবেস এরর হলে টোকেন ডেটা দিয়ে এগিয়ে যাবে
    }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Optional auth — attaches req.user when a token is present, else continues as guest
async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'change_me_super_secret');
      try {
        const db = require('../config/db');
        const [[u]] = await db.query(
          'SELECT account_status, strike_count, unblock_appeal_status, block_reason FROM users WHERE id = ?',
          [req.user.id]
        );
        if (u) {
          req.user.account_status = u.account_status;
          req.user.strike_count = Number(u.strike_count || 0);
          req.user.unblock_appeal_status = u.unblock_appeal_status;
          req.user.block_reason = u.block_reason;
        }
      } catch {
        // noop
      }
    } catch { /* guest */ }
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden for this role' });
    }
    next();
  };
}

/**
 * অ্যাক্টিভ অ্যাকাউন্ট ভ্যালিডেশন গার্ড (requireActiveAccount):
 * এডমিন কর্তৃক সাসপেন্ডেড (স্ট্রাইক ১) বা পার্মানেন্টলি ব্লকড (স্ট্রাইক ২) ইউজারদের
 * পেমেন্ট, ভিজিট বুকিং বা প্রপার্টি অ্যাড করার এক্সেস কঠোরভাবে আটকে দেওয়া হয়।
 */
function requireActiveAccount(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });

  if (req.user.account_status === 'SUSPENDED') {
    return res.status(403).json({
      message: 'Account suspended due to rule violation (Strike 1). Please submit an unblock appeal via chatbot.',
      account_status: 'SUSPENDED',
      strike_count: req.user.strike_count || 1,
      block_reason: req.user.block_reason || 'Rule violation',
      unblock_appeal_status: req.user.unblock_appeal_status || 'NONE',
    });
  }

  if (req.user.account_status === 'BLOCKED') {
    return res.status(403).json({
      message: 'Account permanently blocked due to repeated rule violations (Strike 2).',
      account_status: 'BLOCKED',
      strike_count: req.user.strike_count || 2,
      block_reason: req.user.block_reason || 'Repeated violations',
    });
  }

  next();
}

module.exports = { signToken, authMiddleware, optionalAuth, requireRole, requireActiveAccount };
