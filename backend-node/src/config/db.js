const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'prent_db',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com')))
    ? { rejectUnauthorized: false }
    : undefined,
  // POINT(lat/lng) handling: return as [lng, lat] objects
  typeCast(field, next) {
    if (field.type === 'GEOMETRY') return field.buffer();
    return next();
  },
});

module.exports = pool;
