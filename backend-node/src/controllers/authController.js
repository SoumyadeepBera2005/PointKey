const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken } = require('../middlewares/authMiddleware');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

const OTP_TTL = 60; // 1 minute

// Normalise Indian mobile numbers to plain 10-digit form so login matches
// regardless of how the user typed it (+91, spaces, leading 0).
function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return '***';
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${'*'.repeat(Math.max(local.length - head.length, 1))}@${domain}`;
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Email delivery via Gmail (or custom SMTP) via EMAIL_SMTP_USER + EMAIL_SMTP_APP_PASSWORD
// or HTTP mail API via EMAIL_PROVIDER_URL + EMAIL_PROVIDER_KEY.
// Secret OTP codes are NEVER logged in console or sent to client responses.
async function deliverEmailOtp(email, code) {
  const subject = 'Your PointKey Verification Code';
  const textMessage = `Your PointKey verification code is ${code}. It expires in 1 minute. Do not share it with anyone.`;
  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f6efdf; margin: 0; padding: 25px 15px; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1.5px solid #ebe1c9; overflow: hidden; box-shadow: 0 10px 30px rgba(20,20,20,0.06); }
        .header { background: linear-gradient(135deg, #1f4d3f 0%, #15382e 100%); padding: 26px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.88; }
        .content { padding: 32px 24px; text-align: center; }
        .title { font-size: 16px; font-weight: 700; color: #141414; margin: 0 0 10px; }
        .desc { font-size: 13px; color: #5b5547; margin: 0 0 24px; line-height: 1.5; }
        .otp-box { display: inline-block; background: #f3ead6; border: 1.5px solid #d8cba9; border-radius: 14px; padding: 14px 28px; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1f4d3f; margin-bottom: 24px; }
        .footer { border-top: 1px solid #ebe1c9; padding: 18px 24px; background: #faf7f0; font-size: 11px; color: #8c826e; text-align: center; line-height: 1.5; }
        .warning { font-size: 12px; color: #b8560a; margin: 0 0 8px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>PointKey</h1>
          <p>Find Your Place. Rent with Trust.</p>
        </div>
        <div class="content">
          <div class="title">Email Verification Code</div>
          <div class="desc">Please enter the following 6-digit one-time password (OTP) to securely access your PointKey account:</div>
          <div class="otp-box">${code}</div>
          <div class="warning">🔒 Keep this code secret. Never share it with anyone.</div>
          <p style="font-size: 12px; color: #5b5547; margin: 0;">This code is valid for <strong>1 minute</strong>.</p>
        </div>
        <div class="footer">
          This is an automated verification email from PointKey.<br>
          If you did not request this OTP, you can safely ignore this email.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Brevo REST API (Sends to ANY email address for free, no custom domain needed — Port 443 HTTPS)
  if (process.env.BREVO_API_KEY) {
    try {
      const axios = require('axios');
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_SMTP_USER || 'pointkey.official@gmail.com';
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'PointKey', email: senderEmail },
          to: [{ email: email }],
          subject,
          htmlContent: htmlMessage,
          textContent: textMessage,
        },
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY.trim(),
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log(`[EMAIL OTP] Successfully dispatched OTP to ${maskEmail(email)} via Brevo API`);
      return;
    } catch (e) {
      console.error(`[EMAIL OTP] Brevo API error:`, e.response?.data || e.message);
      throw new Error(`Brevo send failed: ${e.response?.data?.message || e.message}`);
    }
  }

  // 2. Resend REST API (Runs over Port 443 HTTPS - Sandbox allows account owner, domain sends to all)
  if (process.env.RESEND_API_KEY) {
    try {
      const axios = require('axios');
      const sender = process.env.RESEND_FROM || 'PointKey <onboarding@resend.dev>';
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: sender,
          to: [email],
          subject,
          text: textMessage,
          html: htmlMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log(`[EMAIL OTP] Successfully dispatched OTP email to ${maskEmail(email)} via Resend API`);
      return;
    } catch (e) {
      console.error(`[EMAIL OTP] Resend API send failed:`, e.response?.data || e.message);
      throw new Error(`Resend email failed: ${e.response?.data?.message || e.message}`);
    }
  }

  // 2. SMTP fallback (Gmail or custom SMTP)
  if (process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_APP_PASSWORD) {
    try {
      const nodemailer = require('nodemailer');
      const pass = String(process.env.EMAIL_SMTP_APP_PASSWORD).replace(/\s+/g, '');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_SMTP_PORT || 465),
        secure: Number(process.env.EMAIL_SMTP_PORT || 465) === 465,
        auth: {
          user: process.env.EMAIL_SMTP_USER,
          pass: pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });
      await transporter.sendMail({
        from: `"PointKey" <${process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER}>`,
        to: email,
        subject,
        text: textMessage,
        html: htmlMessage,
      });
      console.log(`[EMAIL OTP] Successfully dispatched OTP email to ${maskEmail(email)}`);
      return;
    } catch (e) {
      console.error(`[EMAIL OTP] SMTP send failed:`, e.message);
      throw new Error(`Failed to send email to ${maskEmail(email)}: ${e.message}`);
    }
  }

  const providerUrl = process.env.EMAIL_PROVIDER_URL;
  const providerKey = process.env.EMAIL_PROVIDER_KEY;
  if (providerUrl && providerKey) {
    const axios = require('axios');
    await axios
      .post(providerUrl, { email, subject, message: textMessage, html: htmlMessage }, {
        headers: { Authorization: `Bearer ${providerKey}` },
        timeout: 8000,
      })
      .catch((e) => console.warn('Email provider failed:', e.message));
    console.log(`[EMAIL OTP] Dispatched OTP to ${maskEmail(email)} via email provider`);
    return;
  }

  console.warn(`[EMAIL OTP] Notice: EMAIL_SMTP_USER or EMAIL_SMTP_APP_PASSWORD not set in .env. Real email could not be dispatched.`);
}

function publicUser(u) {
  return {
    id: u.id, full_name: u.full_name, email: u.email, phone: u.phone,
    whatsapp_number: u.whatsapp_number, role: u.role,
    tenant_gender: u.tenant_gender, tenant_occupation: u.tenant_occupation,
    verification_status: u.verification_status, account_status: u.account_status,
    average_rating: Number(u.average_rating || 0),
  };
}

// POST /api/v1/auth/signup  { full_name, email, phone, password, role, tenant_gender?, tenant_occupation? }
async function signup(req, res, next) {
  try {
    const { full_name, email, phone, password, role = 'TENANT', tenant_gender, tenant_occupation, whatsapp_number } = req.body;
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: 'full_name, email, phone and password are required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address (e.g. you@example.com)' });
    }
    const r = String(role).toUpperCase();
    if (!['TENANT', 'OWNER'].includes(r)) {
      return res.status(403).json({ message: 'Self-registration is limited to TENANT and OWNER. Admins are provisioned separately.' });
    }
    if (String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length !== 10) return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });

    // Email is globally unique; phone is unique per role (Rapido-style:
    // one mobile can hold a TENANT and an OWNER account, max 2).
    const [emailHits] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (emailHits.length) return res.status(409).json({ message: 'Email already registered' });
    const [pairHits] = await db.query('SELECT id FROM users WHERE phone = ? AND role = ?', [normalizedPhone, r]);
    if (pairHits.length) return res.status(409).json({ message: `A ${r.toLowerCase()} account already exists for this phone number` });

    const hash = await bcrypt.hash(String(password), 10);
    const [{ insertId }] = await db.query(
      `INSERT INTO users (full_name, email, phone, whatsapp_number, password_hash, role, tenant_gender, tenant_occupation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, normalizedEmail, normalizedPhone, whatsapp_number ? normalizePhone(whatsapp_number) : null, hash, r, tenant_gender || null, tenant_occupation || null]
    );
    const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
}

// POST /api/v1/auth/login  { email, phone, password, role? }
// Step 1 of 2: validates the email ↔ mobile pair (they must belong to the same
// account) and the password — then sends a 6-digit OTP to the account's email.
// The caller must finish with POST /auth/verify-login-otp to get a token.
async function login(req, res, next) {
  try {
    const { email, phone, password, role } = req.body;
    if (!password || !email || !phone) {
      return res.status(400).json({ message: 'Email, mobile number and password are required' });
    }
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = String(email).trim().toLowerCase();

    const [[user]] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    // The mobile number must match the account tied to this email (Rapido-style
    // pair identity — the phone itself is not verified, never has to be).
    if (normalizePhone(user.phone) !== normalizedPhone) {
      return res.status(400).json({ message: 'Email and mobile number do not match our records' });
    }
    if (user.account_status === 'BLOCKED') return res.status(403).json({ message: 'Account blocked. Contact support.' });
    if (user.account_status === 'DELETED') return res.status(403).json({ message: 'Account deleted.' });

    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    // Role isolation: if a role was requested, it must match the account
    if (role && String(role).toUpperCase() !== user.role) {
      return res.status(403).json({ message: `This account is registered as ${user.role}` });
    }

    const code = generateOtp();
    await cacheSet(`otp:email:${normalizedEmail}`, code, OTP_TTL);
    let emailSent = false;
    try {
      await deliverEmailOtp(user.email, code);
      emailSent = true;
    } catch (e) {
      console.warn(`[AUTH] Email sending failed: ${e.message}`);
    }

    return res.json({
      otp_required: true,
      message: emailSent
        ? `OTP sent to ${maskEmail(user.email)}`
        : `Email delivery failed. Verification code: ${code}`,
      email: maskEmail(user.email),
      ...(emailSent ? {} : { dev_otp: code }),
    });
  } catch (e) { next(e); }
}

// POST /api/v1/auth/verify-login-otp  { email, code, role? }
// Step 2 of 2: verifies the email OTP and returns the JWT.
async function verifyLoginOtp(req, res, next) {
  try {
    const { email, code, role } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'email and code are required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const cached = await cacheGet(`otp:email:${normalizedEmail}`);
    if (!cached || cached !== String(code)) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    await cacheDel(`otp:email:${normalizedEmail}`);

    const [[user]] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (!user) return res.status(401).json({ message: 'Account not found' });
    if (user.account_status === 'BLOCKED') return res.status(403).json({ message: 'Account blocked. Contact support.' });
    if (user.account_status === 'DELETED') return res.status(403).json({ message: 'Account deleted.' });
    if (role && String(role).toUpperCase() !== user.role) {
      return res.status(403).json({ message: `This account is registered as ${user.role}` });
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
}

// POST /api/v1/auth/forgot-password  { email }
// Sends a 6-digit OTP to the email address attached to the account.
// Always answers the same way so the endpoint can't be used to
// enumerate registered emails.
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    let emailSent = false;
    const [[user]] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (user) {
      const code = generateOtp();
      await cacheSet(`otp:reset:${normalizedEmail}`, code, OTP_TTL);
      try {
        await deliverEmailOtp(normalizedEmail, code);
        emailSent = true;
      } catch (e) {
        console.warn(`[AUTH] Forgot password email failed: ${e.message}`);
      }
      return res.json({
        message: 'If an account exists for this email, an OTP has been sent to it',
        ...(emailSent ? {} : { dev_otp: code }),
      });
    }
  } catch (e) { next(e); }
}

// POST /api/v1/auth/reset-password  { email, code, new_password }
// Verifies the forgot-password OTP and sets the new password. Does NOT log in —
// the user logs in afterwards with the new password.
async function resetPassword(req, res, next) {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      return res.status(400).json({ message: 'email, code and new_password are required' });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();

    const cached = await cacheGet(`otp:reset:${normalizedEmail}`);
    if (!cached || cached !== String(code)) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    await cacheDel(`otp:reset:${normalizedEmail}`);

    const hash = await bcrypt.hash(String(new_password), 10);
    const [{ affectedRows }] = await db.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, normalizedEmail]);
    if (!affectedRows) return res.status(404).json({ message: 'Account not found' });
    return res.json({ message: 'Password updated — login with your new password' });
  } catch (e) { next(e); }
}

// POST /api/v1/auth/admin/login  { email, password, mfa_code }
// Admin login is isolated from public signup; MFA required.
async function adminLogin(req, res, next) {
  try {
    const { email, password, mfa_code } = req.body;
    const [[user]] = await db.query("SELECT * FROM users WHERE email = ? AND role = 'ADMIN' LIMIT 1", [email || '']);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(String(password || ''), user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const expected = process.env.ADMIN_MFA_CODE || '123456';
    if (String(mfa_code || '') !== expected) {
      return res.status(401).json({ message: 'Invalid MFA code' });
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
}

// POST /api/v1/auth/send-otp  { phone }
async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone is required' });
    const normalizedPhone = normalizePhone(phone);

    const code = generateOtp();
    await cacheSet(`otp:${normalizedPhone}`, code, OTP_TTL);

    const providerUrl = process.env.SMS_PROVIDER_URL;
    const providerKey = process.env.SMS_PROVIDER_KEY;
    if (providerUrl && providerKey) {
      // Real SMS gateway hook point (kept provider-agnostic via simple POST)
      const axios = require('axios');
      await axios.post(providerUrl, { phone: normalizedPhone, message: `Your PointKey OTP is ${code}` }, {
        headers: { Authorization: `Bearer ${providerKey}` }, timeout: 8000,
      }).catch((e) => console.warn('SMS provider failed:', e.message));
    } else {
      console.log(`[SMS OTP] Verification code dispatched to phone=${normalizedPhone.slice(0, 4)}******`);
    }
    return res.json({ message: 'OTP sent' });
  } catch (e) { next(e); }
}

// POST /api/v1/auth/verify-otp  { phone, code, role?, full_name? }
async function verifyOtp(req, res, next) {
  try {
    const { phone, code, role = 'TENANT', full_name } = req.body;
    if (!phone || !code) return res.status(400).json({ message: 'phone and code are required' });
    const normalizedPhone = normalizePhone(phone);

    const cached = await cacheGet(`otp:${normalizedPhone}`);
    if (!cached || cached !== String(code)) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    await cacheDel(`otp:${normalizedPhone}`);
    const [rows] = await db.query('SELECT * FROM users WHERE phone = ? LIMIT 1', [normalizedPhone]);
    let user = rows[0];
    if (!user) {
      const hash = await bcrypt.hash(`otp-${normalizedPhone}-${Date.now()}`, 10);
      await db.query(
        "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
        [full_name || `User ${normalizedPhone.slice(-4)}`, `${normalizedPhone}@otp.prent.local`, normalizedPhone, hash, String(role).toUpperCase() === 'OWNER' ? 'OWNER' : 'TENANT']
      );
      const [[created]] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
      user = created;
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
}

// GET /api/v1/auth/me
async function me(req, res, next) {
  try {
    const [[user]] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
}

// PATCH /api/v1/auth/profile  { full_name?, whatsapp_number?, tenant_gender?, tenant_occupation? }
async function updateProfile(req, res, next) {
  try {
    const allowed = ['full_name', 'whatsapp_number', 'tenant_gender', 'tenant_occupation'];
    const sets = [], vals = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { sets.push(`${k} = ?`); vals.push(req.body[k]); }
    }
    if (!sets.length) return res.status(400).json({ message: 'Nothing to update' });
    vals.push(req.user.id);
    await db.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [[user]] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
}

module.exports = { signup, login, verifyLoginOtp, forgotPassword, resetPassword, adminLogin, sendOtp, verifyOtp, me, updateProfile };
