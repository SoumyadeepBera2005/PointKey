const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

const isConfigured = Boolean(key_id && key_secret);
const instance = isConfigured ? new Razorpay({ key_id, key_secret }) : null;

module.exports = { instance, isConfigured, key_id };
