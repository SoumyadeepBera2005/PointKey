const db = require('../config/db');
const { cacheGet, cacheSet } = require('../config/redis');

/**
 * GET /api/v1/properties/search
 * Conditional filter tree from the spec:
 *   Family            -> category IN (ROOM, FLAT) only
 *   Male/Female       -> requires occupation for PG/SHARED, else Rooms/Flat
 *   category=ROOM + sub_type=PERSONAL_ROOM -> bathroom/kitchen filters
 *   category=PG       -> food_included, bathroom_type
 *   lat/lng/radiusKm  -> ST_Distance_Sphere filter
 */
async function searchProperties(req, res, next) {
  try {
    const q = req.query;
    const cacheKey = `search:${JSON.stringify(q)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const where = ['p.booking_status = ?']; // unbooked only by default
    const params = ['UNBOOKED'];

    // --- Identity-driven category rules ---
    const gender = (q.gender || '').toUpperCase();       // MALE | FEMALE | FAMILY
    const occupation = (q.occupation || '').toUpperCase(); // STUDENT | WORKING_PROFESSIONAL | FAMILY

    if (gender === 'FAMILY' || occupation === 'FAMILY') {
      where.push("p.category IN ('ROOM','FLAT')");
    } else {
      const cat = (q.category || '').toUpperCase();
      if (cat && ['ROOM', 'PG', 'FLAT'].includes(cat)) {
        // Direct browsing is unrestricted — the guided wizard enforces
        // occupation selection before unlocking PG for families.
        where.push('p.category = ?');
        params.push(cat);
      }
    }

    if (gender && ['MALE', 'FEMALE'].includes(gender)) {
      where.push("(p.allowed_gender = ? OR p.allowed_gender = 'ANY')");
      params.push(gender);
    }
    if (occupation && ['STUDENT', 'WORKING_PROFESSIONAL', 'FAMILY'].includes(occupation)) {
      where.push("(p.allowed_tenant_type = ? OR p.allowed_tenant_type = 'ANY')");
      params.push(occupation);
    }

    // --- Granular sub-filters ---
    const eqFilters = [
      ['sub_type', 'p.sub_type'],
      ['bathroom_type', 'p.bathroom_type'],
    ];
    for (const [param, column] of eqFilters) {
      if (q[param]) { where.push(`${column} = ?`); params.push(String(q[param]).toUpperCase()); }
    }
    if (q.food_included !== undefined) { where.push('p.food_included = ?'); params.push(q.food_included === 'true' ? 1 : 0); }
    if (q.kitchen_available !== undefined) { where.push('p.kitchen_available = ?'); params.push(q.kitchen_available === 'true' ? 1 : 0); }
    if (q.min_rent) { where.push('p.rent_amount >= ?'); params.push(Number(q.min_rent)); }
    if (q.max_rent) { where.push('p.rent_amount <= ?'); params.push(Number(q.max_rent)); }
    if (q.bhk) { where.push('p.sub_type = ?'); params.push(String(q.bhk).toUpperCase()); }
    if (q.sharing_capacity) { where.push('p.room_sharing_capacity = ?'); params.push(Number(q.sharing_capacity)); }
    if (q.city) { where.push('p.city LIKE ?'); params.push(`%${q.city}%`); }
    if (q.locality) { where.push('p.locality LIKE ?'); params.push(`%${q.locality}%`); }
    if (q.verified === 'true') { where.push("p.verification_status = 'VERIFIED'"); }

    // --- Spatial radius search ---
    // NOTE: ${distanceSelect} is placed in the SELECT clause, so its parameters
    // must be bound FIRST in the array — keep them in separate buckets and
    // concatenate at the end in SQL-appearance order.
    let distanceSelect = '';
    const selectParams = [];
    const spatialParams = [];
    if (q.lat && q.lng && q.radiusKm) {
      distanceSelect = ", ST_Distance_Sphere(p.location, ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?, ')'), 4326, 'axis-order=long-lat')) / 1000 AS distance_km";
      selectParams.push(Number(q.lng), Number(q.lat));
      where.push("ST_Distance_Sphere(p.location, ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?, ')'), 4326, 'axis-order=long-lat')) <= ?");
      spatialParams.push(Number(q.lng), Number(q.lat), Number(q.radiusKm) * 1000);
    }

    const sql = `
      SELECT p.id, p.property_code, p.title, p.category, p.sub_type, p.allowed_gender,
             p.allowed_tenant_type, p.room_sharing_capacity, p.bathroom_type, p.kitchen_available,
             p.food_included, p.rent_amount, p.advance_amount, p.contract_months,
             p.water_bill_included, p.electricity_bill_included, p.size_sqft, p.locality, p.city,
             p.booking_status, p.verification_status, p.average_rating,
             (SELECT media_url FROM property_media m WHERE m.property_id = p.id ORDER BY m.is_cover DESC LIMIT 1) AS cover_url
             ${distanceSelect}
      FROM properties p
      WHERE ${where.join(' AND ')}
      ORDER BY ${distanceSelect ? 'distance_km ASC' : 'p.average_rating DESC'}
      LIMIT ${Math.min(Number(q.limit) || 30, 100)}`;

    const sqlParams = [...selectParams, ...params, ...spatialParams];
    const [rows] = await db.query(sql, sqlParams);
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const toAbs = (u) => {
      if (!u || typeof u !== 'string') return u;
      if (u.startsWith('/uploads/') || u.startsWith('uploads/')) {
        const clean = u.startsWith('/') ? u : `/${u}`;
        return `${protocol}://${host}${clean}`;
      }
      return u;
    };

    const parsedRows = rows.map((r) => ({
      ...r,
      cover_url: toAbs(r.cover_url),
    }));

    const payload = { results: parsedRows, count: parsedRows.length };
    await cacheSet(cacheKey, JSON.stringify(payload), 60);
    res.json(payload);
  } catch (e) { next(e); }
}

module.exports = { searchProperties };
