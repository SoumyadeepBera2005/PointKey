/**
 * =============================================================================
 * POINTKEY DATABASE SETUP SCRIPT (setupDatabase.js)
 * =============================================================================
 * এই স্ক্রিপ্টটির কাজ হলো ক্লাউড ডাটাবেস (Aiven Cloud MySQL বা লোকাল MySQL)-এ
 * সরাসরি কানেক্ট করে প্রজেক্টের সমস্ত টেবিল (schema.sql) তৈরি করা
 * এবং প্রাথমিক ডেমো ডেটা (seed.sql) ইনসার্ট করা।
 * 
 * কীভাবে রান করবেন:
 * টার্মিনালে যান:
 * cd backend-node
 * npm run db:setup
 * 
 * যা যা সমাধান করা হয়েছে:
 * ১. Aiven Cloud SSL কানেকশন (`ssl: { rejectUnauthorized: false }`) সমর্থন।
 * ২. একাধিক SQL স্টেটমেন্ট একসঙ্গে রান করার অনুমতি (`multipleStatements: true`)।
 * ৩. অটোমেটিক prent_db তৈরি এবং টেবিল কনফিগারেশন।
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function setupDatabase() {
  console.log('🔄 ডাটাবেস কানেকশন শুরু হচ্ছে...');
  console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`Port: ${process.env.DB_PORT || 3306}`);
  console.log(`User: ${process.env.DB_USER || 'root'}`);

  let connection;
  try {
    // Aiven ক্লাউডের জন্য SSL সক্রিয় করা
    const useSSL = process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'));

    // ১. প্রথমে নির্দিষ্ট কোনো ডাটাবেস নাম ছাড়া সার্ভারে কানেক্ট হওয়া (CREATE DATABASE রান করার জন্য)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
      ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    });

    console.log('✅ ডাটাবেস সার্ভারে সফলভাবে কানেক্ট হয়েছে!');

    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql পাওয়া যায়নি: ${schemaPath}`);
    }

    // ২. schema.sql রিড করে সমস্ত টেবিল (users, properties, visits, payments ইত্যাদি) তৈরি করা
    console.log('⏳ schema.sql রান হচ্ছে (টেবিল তৈরি করা হচ্ছে)...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✅ schema.sql সফলভাবে এক্সিকিউট হয়েছে! (সব টেবিল তৈরি সম্পন্ন)');

    // ৩. seed.sql রিড করে ডেমো প্রোপার্টি ও ডেমো অ্যাকাউন্ট ইনসার্ট করা
    if (fs.existsSync(seedPath)) {
      console.log('⏳ seed.sql রান হচ্ছে (ডেমো ডেটা ইনসার্ট করা হচ্ছে)...');
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await connection.query(seedSql);
      console.log('✅ seed.sql সফলভাবে এক্সিকিউট হয়েছে! (ডেমো ডেটা ইনসার্ট সম্পন্ন)');
    }

    console.log('\n🎉 অভিনন্দন! ডাটাবেস সেটআপ সম্পূর্ণ হয়েছে!');
  } catch (error) {
    console.error('\n❌ ডাটাবেস সেটআপে সমস্যা হয়েছে:');
    console.error(error.message || error);
    console.log('\n💡 সমাধানের উপায়:');
    console.log('১. backend-node/.env ফাইলে DB_HOST, DB_PORT, DB_USER, DB_PASSWORD সঠিকভাবে দিয়েছেন কি না যাচাই করুন।');
    console.log('২. যদি Aiven ব্যবহার করেন, তাহলে নিশ্চিত হন আপনার Aiven MySQL সার্ভিসটি "Running" অবস্থায় আছে।');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// স্ক্রিপ্ট এক্সিকিউট করা
setupDatabase();
