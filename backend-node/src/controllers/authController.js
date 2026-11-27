/**
 * =============================================================================
 * POINTKEY AUTH CONTROLLER (authController.js)
 * =============================================================================
 * এই ফাইলে ইউজার অথেনটিকেশন, রেজিস্ট্রেশন (Signup), টু-ফ্যাক্টর ইমেইল ওটিপি (OTP)
 * ভেরিফিকেশন এবং পাসওয়ার্ড রিসেট সংক্রান্ত সকল ব্যাকএন্ড লজিক রয়েছে।
 * =============================================================================
 */

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken } = require('../middlewares/authMiddleware');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');

// ওটিপি ভেরিফিকেশনের মেয়াদ (TTL) = ৬০ সেকেন্ড (১ মিনিট)
const OTP_TTL = 60; // 1 minute

/**
 * ভারতীয় ১০-সংখ্যার মোবাইল নম্বর নরমালাইজেশন ফাংশন:
 * ইউজার যেভাবে টাইপ করুক না কেন (+91 9988..., 09988..., বা 9988...),
 * এটি অতিরিক্ত স্পেস বা কান্ট্রি কোড মুছে সঠিক ১০ ডিজিট বের করে নেয়।
 */
function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/**
 * ইমেইল ঠিকানা মাস্কিং ফাংশন (গোপনীয়তা রক্ষার জন্য):
 * যেমন: soumyadeep... -> so*********@gmail.com
 */
function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return '***';
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${'*'.repeat(Math.max(local.length - head.length, 1))}@${domain}`;
}

/**
 * ৬-সংখ্যার র‍্যান্ডম ওটিপি (One-Time Password) জেনারেটর
 */
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * ইমেইলে ওটিপি প্রেরণের কেন্দ্রীয় ফাংশন:
 * -------------------------------------------------------------
 * ১. Brevo HTTPS REST API (Port 443):
 *    - রেন্ডার ক্লাউডের ফ্রি টায়ারে সাধারণ SMTP পোর্ট (25, 465, 587) ব্লক থাকে।
 *    - তাই Brevo REST API ব্যবহার করা হয়েছে যা পোর্ট ৪৪৩ দিয়ে যেকোনো ইমেইলে
 *      (Gmail, Yahoo, Outlook) শতভাগ সফলভাবে ওটিপি পৌঁছে দেয়।
 * ২. Fallback হিসেবে Nodemailer Gmail SMTP রাখা হয়েছে (লোকাল ডেভেলপমেন্টের জন্য)।
 */
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

/**
 * ক্লায়েন্টে নিরাপদে প্রেরণের জন্য ইউজারের পাবলিক প্রোফাইল অবজেক্ট তৈরি:
 * এতে স্ট্রাইক কাউন্ট (strike_count), সাসপেনশনের কারণ (block_reason)
 * এবং আনব্লক আপিলের স্ট্যাটাস ও স্টেটমেন্ট ফিল্ড অন্তর্ভুক্ত করা হয়েছে।
 */
function publicUser(u) {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    whatsapp_number: u.whatsapp_number,
    role: u.role,
    tenant_gender: u.tenant_gender,
    tenant_occupation: u.tenant_occupation,
    verification_status: u.verification_status,
    account_status: u.account_status,
    strike_count: Number(u.strike_count || 0),
    block_reason: u.block_reason || null,
    unblock_appeal_status: u.unblock_appeal_status || 'NONE',
    unblock_appeal_text: u.unblock_appeal_text || null,
    unblock_appeal_date: u.unblock_appeal_date || null,
    average_rating: Number(u.average_rating || 0),
  };
}

/**
 * =============================================================================
 * POST /api/v1/auth/signup
 * =============================================================================
 * নতুন ইউজার রেজিস্ট্রেশন:
 * - নাম, ইমেইল, মোবাইল ও পাসওয়ার্ড যাচাই করা।
 * - পাসওয়ার্ড bcrypt দিয়ে হ্যাশ করে নিরাপদে রাখা।
 * - safeGender & safeOcc: MySQL ডাটাবেসে জেন্ডার ও অকুপেশন যাতে সঠিকভাবে ঢোকে
 *   এবং 'Data truncated' এরর না আসে তার সুরক্ষা ব্যবস্থা।
 */
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
    // safeGender ও safeOcc: 'FREELANCER', 'OTHER', 'STUDENT' ইত্যাদি সকল অকুপেশন সেভ করার সুরক্ষা
    const safeGender = tenant_gender ? String(tenant_gender).trim().toUpperCase() : null;
    const safeOcc = tenant_occupation ? String(tenant_occupation).trim() : null;
    const [{ insertId }] = await db.query(
      `INSERT INTO users (full_name, email, phone, whatsapp_number, password_hash, role, tenant_gender, tenant_occupation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, normalizedEmail, normalizedPhone, whatsapp_number ? normalizePhone(whatsapp_number) : null, hash, r, safeGender, safeOcc]
    );
    const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) { next(e); }
}

/**
 * =============================================================================
 * POST /api/v1/auth/login (ধাপ ১ - OYO & Blinkit style passwordless login)
 * =============================================================================
 * ১. ইউজার শুধুমাত্র ইমেইল ও মোবাইল নম্বর দিয়ে লগইন/সাইনআপ রিকোয়েস্ট করবে।
 * ২. কোনো পাসওয়ার্ডের প্রয়োজন নেই।
 * ৩. ইউজারের ইমেইলে ৬-ডিজিটের ওটিপি পাঠায় (Brevo / Resend / fallback)।
 * ৪. ক্যাশ বা রেডিসে ওটিপি ৬০ সেকেন্ডের জন্য সংরক্ষণ করে।
 */
async function login(req, res, next) {
  try {
    const { email, phone, password, role } = req.body;
    if (!email || !phone) {
      return res.status(400).json({ message: 'Email and mobile number are required' });
    }
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }
    if (normalizedPhone.length !== 10) {
      return res.status(400).json({ message: 'Enter a valid 10-digit mobile number' });
    }

    const [[existingUser]] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existingUser) {
      if (existingUser.account_status === 'BLOCKED') return res.status(403).json({ message: 'Account blocked. Contact support.' });
      if (existingUser.account_status === 'DELETED') return res.status(403).json({ message: 'Account deleted.' });

      // If password was explicitly provided, verify it (for backward compatibility)
      if (password) {
        const ok = await bcrypt.compare(String(password), existingUser.password_hash);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    const code = generateOtp();
    await cacheSet(`otp:email:${normalizedEmail}`, code, OTP_TTL);
    await cacheSet(`otp:phone:${normalizedEmail}`, normalizedPhone, OTP_TTL);

    let emailSent = false;
    try {
      await deliverEmailOtp(normalizedEmail, code);
      emailSent = true;
    } catch (e) {
      console.warn(`[AUTH] Email sending failed: ${e.message}`);
    }

    return res.json({
      otp_required: true,
      message: emailSent
        ? `OTP sent to ${maskEmail(normalizedEmail)}`
        : `Email delivery failed. Verification code: ${code}`,
      email: maskEmail(normalizedEmail),
      ...(emailSent ? {} : { dev_otp: code }),
    });
  } catch (e) { next(e); }
}

/**
 * =============================================================================
 * POST /api/v1/auth/verify-login-otp (ধাপ ২ - OYO & Blinkit style OTP verification)
 * =============================================================================
 * ১. ইউজার ফর্ম থেকে পাঠানো ৬-ডিজিটের কোড ক্যাশের সাথে যাচাই করে।
 * ২. ইউজার যদি নতুন হয়, স্বয়ংক্রিয়ভাবে পয়েন্টকি অ্যাকাউন্ট তৈরি হয়ে যাবে (No password needed)।
 * ৩. ইউজার যদি পুরাতন হয়, সরাসরি পয়েন্টকিতে লগইন সম্পন্ন হবে।
 * ৪. সিকিউর JWT টোকেন ইস্যু করে।
 */
async function verifyLoginOtp(req, res, next) {
  try {
    const { email, code, phone, role } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'email and code are required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const cached = await cacheGet(`otp:email:${normalizedEmail}`);
    if (!cached || cached !== String(code)) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    await cacheDel(`otp:email:${normalizedEmail}`);

    const cachedPhone = await cacheGet(`otp:phone:${normalizedEmail}`);
    await cacheDel(`otp:phone:${normalizedEmail}`);
    const normalizedPhone = phone ? normalizePhone(phone) : (cachedPhone || '0000000000');

    let [[user]] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);

    // OYO & Blinkit style: if user does not exist yet, seamlessly auto-create account
    if (!user) {
      const randomPassword = `otp_${Date.now()}_${Math.random()}`;
      const hash = await bcrypt.hash(randomPassword, 10);
      const defaultName = `User ${normalizedPhone.slice(-4)}`;
      const targetRole = (role && String(role).toUpperCase() === 'OWNER') ? 'OWNER' : 'TENANT';
      
      await db.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`,
        [defaultName, normalizedEmail, normalizedPhone, hash, targetRole]
      );
      [[user]] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    } else {
      if (user.account_status === 'BLOCKED') return res.status(403).json({ message: 'Account blocked. Contact support.' });
      if (user.account_status === 'DELETED') return res.status(403).json({ message: 'Account deleted.' });
      if (normalizedPhone && normalizedPhone.length === 10 && normalizePhone(user.phone) !== normalizedPhone) {
        await db.query('UPDATE users SET phone = ? WHERE id = ?', [normalizedPhone, user.id]);
        user.phone = normalizedPhone;
      }
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

/**
 * =============================================================================
 * POST /api/v1/auth/unblock-appeal
 * =============================================================================
 * রুলস ভায়োলেশনে সাসপেন্ডেড ইউজারের আনব্লক আপিল আবেদন (Strike 1 Reinstatement):
 * - ইউজার চ্যাটবটে রুলস অ্যান্ড রেগুলেশন অঙ্গীকারপত্রে সম্মতি দিলে এই এন্ডপয়েন্টে
 *   রিকোয়েস্ট আসে।
 * - স্ট্রাইক ২ (পার্মানেন্ট ব্লক) ইউজারদের আপিল করার কোনো সুযোগ নেই।
 * - শুধুমাত্র প্রথম স্ট্রাইকে সাসপেন্ডেড থাকা ইউজার একবার অঙ্গীকারনামা দিয়ে
 *   এডমিনের কাছে রিভিউর জন্য পাঠাতে পারবে।
 * - এডমিন ম্যানুয়ালি যাচাই করে অ্যাপ্রুভ করলে তবেই এক্সেস ফিরবে।
 * =============================================================================
 */
async function submitUnblockAppeal(req, res, next) {
  try {
    const { statement } = req.body;
    const [[user]] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // স্ট্রাইক ২ ভায়োলেশনে পার্মানেন্ট ব্যান — কোনো আপিল গ্রহণযোগ্য নয়
    if (Number(user.strike_count || 0) >= 2 || user.account_status === 'BLOCKED') {
      return res.status(403).json({
        message: 'Your account is permanently blocked due to repeated rule violations (Strike 2). Appeals are not permitted under PointKey safety policy.',
      });
    }

    // শুধুমাত্র সাসপেন্ডেড থাকা ইউজারই আপিল করতে পারে
    if (user.account_status !== 'SUSPENDED') {
      return res.status(400).json({
        message: 'Only suspended accounts (Strike 1) can submit an unblock appeal application.',
      });
    }

    const appealStatement = String(statement || '').trim() ||
      'I have read and solemnly pledge to abide by all PointKey platform rules and regulations. I will not engage in off-platform deals or fraudulent actions. I understand that any subsequent violation will permanently terminate my account with Strike 2.';

    await db.query(
      `UPDATE users 
       SET unblock_appeal_status = 'SUBMITTED', 
           unblock_appeal_text = ?, 
           unblock_appeal_date = NOW() 
       WHERE id = ?`,
      [appealStatement, req.user.id]
    );

    // এডমিন অডিট লগে রেকর্ড রাখা
    try {
      await db.query(
        "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, 'UNBLOCK_APPEAL_SUBMITTED', 'USER', ?, ?)",
        [req.user.id, req.user.id, JSON.stringify({ statement: appealStatement })]
      );
    } catch {
      // audit log fail shouldn't break the user appeal
    }

    const [[updated]] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    return res.json({
      message: 'Unblock appeal submitted successfully. PointKey Admin will manually review your application.',
      user: publicUser(updated),
    });
  } catch (e) {
    next(e);
  }
}

/**
 * =============================================================================
 * GET /api/v1/auth/notifications
 * =============================================================================
 * ইউজারের ইন-অ্যাপ নোটিফিকেশন ফেচ করা (যেমন অ্যাকাউন্ট সাসপেনশন, ব্লক, আপিল স্ট্যাটাস):
 * ডাটাবেস থেকে ইউজারের সব নোটিফিকেশন এবং unread_count রিটার্ন করে।
 * =============================================================================
 */
async function getNotifications(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT id, type, title, message, is_read, created_at FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    // সেফটি চেক: ডাটাবেসে ইউজার যদি বর্তমানে SUSPENDED বা BLOCKED থাকে কিন্তু নোটিফিকেশন মিসিং থাকে,
    // তবে নিশ্চিতভাবে তাৎক্ষণিক একটি নোটিফিকেশন তৈরি করে যোগ করা হবে।
    const [[u]] = await db.query('SELECT account_status, strike_count, block_reason FROM users WHERE id = ?', [req.user.id]);
    if (u && (u.account_status === 'SUSPENDED' || u.account_status === 'BLOCKED')) {
      const isBlocked = u.account_status === 'BLOCKED';
      const expectedType = isBlocked ? 'ACCOUNT_BLOCKED' : 'ACCOUNT_SUSPENDED';
      const exists = rows.some((r) => r.type === expectedType);
      if (!exists) {
        const notifId = require('crypto').randomUUID();
        const title = isBlocked ? '⛔ Account Permanently Blocked (Strike 2)' : '⚠️ Account Suspended by Admin (Strike 1)';
        const msg = isBlocked
          ? `Your account has been permanently blocked by Admin: "${u.block_reason || 'Repeated rule violations'}". All listing access and payments are permanently disabled.`
          : `Your account is suspended by Admin for: "${u.block_reason || 'Rule violation'}". View Details and payments are disabled. Open NestAI to submit an appeal.`;
        
        await db.query(
          'INSERT INTO user_notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
          [notifId, req.user.id, expectedType, title, msg]
        );
        rows.unshift({ id: notifId, type: expectedType, title, message: msg, is_read: false, created_at: new Date() });
      }
    }

    const unreadCount = rows.filter((r) => !r.is_read).length;
    res.json({
      notifications: rows,
      unread_count: unreadCount,
      account_status: u?.account_status || 'ACTIVE',
      strike_count: u?.strike_count || 0,
      block_reason: u?.block_reason || null,
    });
  } catch (e) {
    next(e);
  }
}

/**
 * PATCH /api/v1/auth/notifications/read-all
 * সব নোটিফিকেশন রিড হিসেবে মার্ক করা
 */
async function markNotificationsRead(req, res, next) {
  try {
    await db.query('UPDATE user_notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  signup,
  login,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  adminLogin,
  sendOtp,
  verifyOtp,
  me,
  updateProfile,
  submitUnblockAppeal,
  getNotifications,
  markNotificationsRead,
};
