const db = require('../config/db');

// POST /api/v1/ratings  { score, review_text?, target_user_id?, target_property_id? }
async function rate(req, res, next) {
  try {
    const { score, review_text, target_user_id, target_property_id } = req.body;
    const s = Number(score);
    if (!Number.isInteger(s) || s < 1 || s > 5) return res.status(400).json({ message: 'score must be an integer 1-5' });
    if (!target_user_id && !target_property_id) return res.status(400).json({ message: 'Provide target_user_id or target_property_id' });

    await db.query(
      'INSERT INTO ratings (id, reviewer_id, target_user_id, target_property_id, score, review_text) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [req.user.id, target_user_id || null, target_property_id || null, s, review_text || null]
    );
    if (target_property_id) {
      await db.query(
        'UPDATE properties p SET average_rating = (SELECT ROUND(AVG(score), 2) FROM ratings WHERE target_property_id = p.id) WHERE p.id = ?',
        [target_property_id]
      );
    }
    if (target_user_id) {
      await db.query(
        'UPDATE users u SET average_rating = (SELECT ROUND(AVG(score), 2) FROM ratings WHERE target_user_id = u.id) WHERE u.id = ?',
        [target_user_id]
      );
    }
    res.status(201).json({ message: 'Rating recorded' });
  } catch (e) { next(e); }
}

// GET /api/v1/ratings/received
async function myReceivedRatings(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ratings WHERE target_user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ ratings: rows });
  } catch (e) { next(e); }
}

module.exports = { rate, myReceivedRatings };
