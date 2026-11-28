const db = require('../config/db');
const { maskProperty } = require('../middlewares/privacyGuard');
const { signToken } = require('../middlewares/authMiddleware');

const PROPERTY_SELECT = `
  SELECT p.id, p.property_code, p.owner_id, p.title, p.category, p.sub_type, p.allowed_gender,
         p.allowed_tenant_type, p.room_sharing_capacity, p.bathroom_type, p.kitchen_available,
         p.food_included, p.rent_amount, p.advance_amount, p.contract_months,
         p.water_bill_included, p.electricity_bill_included, p.size_sqft, p.roof_floor_type,
         p.room_materials, p.rules_and_regulations, p.allow_parents_friends, p.nearby_landmarks,
         p.locality, p.city, p.exact_address, p.booking_status, p.verification_status,
         p.average_rating, p.created_at, p.photos, p.cover_url, p.video_url, p.video_name,
         p.lister_type, p.furnishing_status,
         u.full_name AS owner_name, u.phone AS owner_phone, u.whatsapp_number AS owner_whatsapp,
         u.email AS owner_email, u.verification_status AS owner_verification_status
  FROM properties p JOIN users u ON u.id = p.owner_id`;

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v; // mysql2 may already parse JSON columns
  try { return JSON.parse(v); } catch { return v; }
}

function toAbsoluteMediaUrl(req, u) {
  if (!u || typeof u !== 'string') return u;
  if (u.startsWith('/uploads/') || u.startsWith('uploads/')) {
    const clean = u.startsWith('/') ? u : `/${u}`;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    return `${protocol}://${host}${clean}`;
  }
  return u;
}

// GET /api/v1/properties/:id  (optionalAuth + applyPropertyPrivacy applied in route)
async function getProperty(req, res, next) {
  try {
    const [[raw]] = await db.query(`${PROPERTY_SELECT} WHERE p.id = ?`, [req.params.id]);
    if (!raw) return res.status(404).json({ message: 'Property not found' });
    const property = maskProperty({ ...raw }, req.isPropertyUnlocked, req.user);
    property.room_materials = parseJson(raw.room_materials);
    property.nearby_landmarks = parseJson(raw.nearby_landmarks);
    if (property.nearby_landmarks && typeof property.nearby_landmarks === 'object' && !Array.isArray(property.nearby_landmarks)) {
      Object.assign(property, property.nearby_landmarks);
    }
    if (req.isPropertyUnlocked) {
      const [[coords]] = await db.query(
        'SELECT ST_Longitude(location) AS lng, ST_Latitude(location) AS lat FROM properties WHERE id = ?',
        [req.params.id]
      );
      property.location = coords ? { lat: Number(coords.lat), lng: Number(coords.lng) } : null;
    }
    const [media] = await db.query(
      'SELECT * FROM property_media WHERE property_id = ? ORDER BY is_cover DESC, captured_date DESC',
      [req.params.id]
    );
    let parsedPhotos = parseJson(raw.photos) || [];
    if (!Array.isArray(parsedPhotos)) parsedPhotos = [];
    property.photos = parsedPhotos.map((ph, idx) => {
      let item = ph;
      if (typeof item === 'string') {
        try {
          const parsed = JSON.parse(item);
          if (parsed && typeof parsed === 'object') item = parsed;
        } catch {}
      }
      if (typeof item === 'string') {
        return {
          label: idx === 0 ? 'Angle 1 (Front/Entrance)' : idx === 1 ? 'Angle 2 (Living/Bedroom)' : 'Angle 3 (Balcony/Kitchen/Side)',
          name: `photo_angle_${idx + 1}.jpg`,
          url: toAbsoluteMediaUrl(req, item),
          preview: toAbsoluteMediaUrl(req, item),
        };
      }
      return {
        ...item,
        label: item?.label || (idx === 0 ? 'Angle 1 (Front/Entrance)' : idx === 1 ? 'Angle 2 (Living/Bedroom)' : 'Angle 3 (Balcony/Kitchen/Side)'),
        name: item?.name || `photo_angle_${idx + 1}.jpg`,
        url: toAbsoluteMediaUrl(req, item?.url || item?.preview || item?.dataUrl),
        preview: toAbsoluteMediaUrl(req, item?.preview || item?.dataUrl || item?.url),
      };
    });
    property.cover_url = toAbsoluteMediaUrl(req, property.cover_url);
    property.video_url = toAbsoluteMediaUrl(req, property.video_url);
    property.electricity_bill_url = toAbsoluteMediaUrl(req, property.electricity_bill_url);

    if (media && media.length > 0) {
      property.media = media.map((m) => ({
        ...m,
        media_url: toAbsoluteMediaUrl(req, m.media_url),
      }));
    } else {
      const photosList = property.photos;
      if (Array.isArray(photosList) && photosList.length > 0) {
        property.media = photosList.map((ph, idx) => ({
          id: `angle-${idx + 1}`,
          room_tag: ph.label || `Angle ${idx + 1}`,
          media_type: 'IMAGE',
          media_url: toAbsoluteMediaUrl(req, ph.url || ph.preview || (typeof ph === 'string' ? ph : '')),
          captured_date: raw.created_at || new Date().toISOString(),
        })).filter((m) => Boolean(m.media_url));
      } else if (raw.cover_url) {
        property.media = [{
          id: 'cover-1',
          room_tag: 'Main View',
          media_type: 'IMAGE',
          media_url: toAbsoluteMediaUrl(req, raw.cover_url),
          captured_date: raw.created_at || new Date().toISOString(),
        }];
      } else {
        property.media = [];
      }
    }
    property.automated_tour_available = true;
    res.json({ property, unlocked: Boolean(req.isPropertyUnlocked) });
  } catch (e) { next(e); }
}

// GET /api/v1/properties/owner/my-listings or /api/v1/properties/my
async function myListings(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.property_code, p.title, p.category, p.sub_type, p.rent_amount, p.advance_amount, p.booking_status,
              p.verification_status, p.average_rating, p.created_at, p.locality, p.city, p.exact_address,
              p.photos, p.video_name, p.video_url, p.electricity_bill_name, p.electricity_bill_url,
              p.rules_and_regulations, p.lister_type,
              ST_Longitude(p.location) AS lng, ST_Latitude(p.location) AS lat,
              (SELECT media_url FROM property_media m WHERE m.property_id = p.id ORDER BY m.is_cover DESC LIMIT 1) AS cover_url
       FROM properties p WHERE p.owner_id = ? ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    const parsedRows = rows.map((r) => {
      let photos = parseJson(r.photos);
      if (Array.isArray(photos)) {
        photos = photos.map((ph) => {
          if (typeof ph === 'string') return toAbsoluteMediaUrl(req, ph);
          if (ph && typeof ph === 'object') {
            return {
              ...ph,
              url: toAbsoluteMediaUrl(req, ph.url || ph.preview),
              preview: toAbsoluteMediaUrl(req, ph.preview || ph.url),
            };
          }
          return ph;
        });
      }
      return {
        ...r,
        cover_url: toAbsoluteMediaUrl(req, r.cover_url),
        video_url: toAbsoluteMediaUrl(req, r.video_url),
        electricity_bill_url: toAbsoluteMediaUrl(req, r.electricity_bill_url),
        video_size_mb: '20',
        electricity_bill_uploaded: Boolean(r.electricity_bill_name || r.electricity_bill_url),
        location: [r.locality, r.city].filter(Boolean).join(', ') || 'Kolkata',
        photos,
      };
    });
    res.json({ listings: parsedRows });
  } catch (e) { next(e); }
}

// POST /api/v1/properties (টেন্যান্ট বা ওনার যে কেউ প্রপার্টি পোস্ট করতে পারবে)
async function createProperty(req, res, next) {
  try {
    const b = req.body;
    const title = (b.title || '').trim();
    const rent_amount = Number(b.rent_amount || b.price || 0);
    const locality = (b.locality || '').trim();
    const city = (b.city || 'Kolkata').trim();
    const exact_address = (b.exact_address || b.address || `Near ${locality}`).trim();

    if (!title) return res.status(400).json({ message: 'Property title is required' });
    if (!rent_amount || rent_amount <= 0) return res.status(400).json({ message: 'Valid rent amount is required' });
    if (!locality) return res.status(400).json({ message: 'Locality is required' });

    const rawCategory = String(b.category || 'FLAT').toUpperCase();
    const category = rawCategory.includes('PG') ? 'PG' : rawCategory.includes('ROOM') ? 'ROOM' : 'FLAT';
    const prefix = category === 'PG' ? 'PG' : category === 'ROOM' ? 'R' : 'F';
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM properties');
    const property_code = `${prefix}${String(Number(cnt) + 1).padStart(2, '0')}`;
    const propId = require('crypto').randomUUID();

    const lat = Number(b.lat || 22.5726);
    const lng = Number(b.lng || 88.3639);
    const sub_type = b.sub_type || b.subtype || (category === 'PG' ? 'Single Sharing Bed' : category === 'ROOM' ? 'Single Room' : '2 BHK');
    const lister_type = b.lister_type || (b.is_builder ? 'Builder' : 'Owner');
    const furnishing_status = b.furnishing_status || b.furnishing || 'Semi-furnished';
    const cover_url = b.cover_url || (Array.isArray(b.photos) && b.photos[0]?.url) || '/assets/images/hero-slide-1.jpg';
    const photosJson = b.photos ? (typeof b.photos === 'string' ? b.photos : JSON.stringify(b.photos)) : null;

    await db.query(
      `INSERT INTO properties
        (id, property_code, owner_id, title, category, sub_type, allowed_gender, allowed_tenant_type,
         room_sharing_capacity, bathroom_type, kitchen_available, food_included, rent_amount, advance_amount,
         contract_months, water_bill_included, electricity_bill_included, size_sqft, roof_floor_type,
         room_materials, rules_and_regulations, allow_parents_friends, nearby_landmarks,
         locality, city, exact_address, location, verification_status,
         lister_type, furnishing_status, cover_url, photos, video_url, video_name,
         electricity_bill_url, electricity_bill_name, alternate_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
               ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?, ')'), 4326, 'axis-order=long-lat'), 'PENDING',
               ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        propId,
        property_code,
        req.user.id,
        title,
        category,
        sub_type,
        b.allowed_gender || 'ANY',
        b.allowed_tenant_type || 'ANY',
        Number(b.room_sharing_capacity || 1),
        b.bathroom_type || b.bathroom || 'PRIVATE',
        b.kitchen_available !== false,
        Boolean(b.food_included),
        rent_amount,
        Number(b.advance_amount || b.deposit || 0),
        Number(b.contract_months || 6),
        Boolean(b.water_bill_included),
        Boolean(b.electricity_bill_included),
        b.size_sqft ? Number(b.size_sqft) : null,
        b.roof_floor_type || null,
        b.room_materials ? JSON.stringify(b.room_materials) : null,
        b.rules_and_regulations || (Array.isArray(b.rules) ? b.rules.join('; ') : null),
        b.allow_parents_friends !== false,
        b.nearby_landmarks ? JSON.stringify(b.nearby_landmarks) : null,
        locality,
        city,
        exact_address,
        lng,
        lat,
        lister_type,
        furnishing_status,
        cover_url,
        photosJson,
        b.video_url || null,
        b.video_name || null,
        b.electricity_bill_url || null,
        b.electricity_bill_name || null,
        b.alternate_phone || null,
      ]
    );

    // Insert owner's 3 angle photos into property_media for instant tenant/admin viewing
    try {
      const parsedPhotos = Array.isArray(b.photos) ? b.photos : (typeof b.photos === 'string' ? JSON.parse(b.photos) : []);
      if (Array.isArray(parsedPhotos)) {
        for (let idx = 0; idx < parsedPhotos.length; idx++) {
          const ph = parsedPhotos[idx];
          const mediaUrl = ph?.url || ph?.preview || (typeof ph === 'string' ? ph : '');
          if (mediaUrl) {
            await db.query(
              `INSERT INTO property_media (id, property_id, media_url, media_type, category, room_tag, is_cover, captured_date)
               VALUES (?, ?, ?, 'IMAGE', 'ROOM', ?, ?, NOW())`,
              [require('crypto').randomUUID(), propId, mediaUrl, ph?.label || `Angle ${idx + 1}`, idx === 0]
            );
          }
        }
      }
    } catch (mediaErr) {
      console.warn('Could not insert into property_media:', mediaErr);
    }

    // টেন্যান্ট যদি প্রপার্টি পোস্ট করে, তাহলে তার ভূমিকা স্বয়ংক্রিয়ভাবে TENANT+OWNER অথবা TENANT+BUILDER এ রূপান্তরিত হবে
    let updatedUser = null;
    const [[currentUser]] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (currentUser && currentUser.role !== 'ADMIN') {
      const isBuilder = String(lister_type || '').toLowerCase().includes('builder');
      let targetRole = currentUser.role;

      if (currentUser.role === 'TENANT') {
        targetRole = isBuilder ? 'TENANT+BUILDER' : 'TENANT+OWNER';
      } else if (currentUser.role === 'TENANT+OWNER' && isBuilder) {
        targetRole = 'TENANT+BUILDER';
      } else if (!currentUser.role.includes('OWNER') && !currentUser.role.includes('BUILDER')) {
        targetRole = isBuilder ? 'TENANT+BUILDER' : 'TENANT+OWNER';
      }

      if (targetRole !== currentUser.role) {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [targetRole, req.user.id]);
      }
      const [[fresh]] = await db.query(
        'SELECT id, full_name, email, phone, role, verification_status, account_status, strike_count FROM users WHERE id = ?',
        [req.user.id]
      );
      updatedUser = fresh;
    }

    // ইউজারের জন্য কনফার্মেশন নোটিফিকেশন তৈরি
    try {
      const notifId = require('crypto').randomUUID();
      await db.query(
        'INSERT INTO user_notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)',
        [
          notifId,
          req.user.id,
          'PROPERTY_SUBMITTED',
          '📋 Property Listing Submitted for Review',
          `Your property "${title}" (${property_code}) has been submitted to Admin. It is currently under verification.`,
        ]
      );
    } catch { }

    const [[created]] = await db.query(
      `SELECT p.id, p.property_code, p.owner_id, p.title, p.category, p.sub_type, p.allowed_gender,
              p.allowed_tenant_type, p.room_sharing_capacity, p.bathroom_type, p.kitchen_available,
              p.food_included, p.rent_amount, p.advance_amount, p.contract_months,
              p.water_bill_included, p.electricity_bill_included, p.size_sqft, p.roof_floor_type,
              p.room_materials, p.rules_and_regulations, p.allow_parents_friends, p.nearby_landmarks,
              p.locality, p.city, p.exact_address, p.booking_status, p.verification_status,
              p.lister_type, p.furnishing_status, p.cover_url, p.photos, p.video_url, p.video_name,
              p.electricity_bill_url, p.electricity_bill_name, p.alternate_phone, p.created_at,
              ST_Longitude(p.location) AS lng, ST_Latitude(p.location) AS lat
       FROM properties p WHERE p.id = ?`,
      [propId]
    );
    if (created) {
      created.photos = parseJson(created.photos);
      created.room_materials = parseJson(created.room_materials);
      created.nearby_landmarks = parseJson(created.nearby_landmarks);
      created.location = [created.locality, created.city].filter(Boolean).join(', ') || 'Kolkata';
    }
    const io = req.app.get('io');
    if (io && created) {
      io.emit('new_property_submitted', created);
      io.emit('property_sync', { action: 'CREATED', property: created });
    }
    const newToken = updatedUser ? signToken(updatedUser) : null;
    res.status(201).json({ property: created, user: updatedUser, token: newToken });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/v1/properties/:id/booking-status  (owner of the listing or admin)
async function setBookingStatus(req, res, next) {
  try {
    const { booking_status } = req.body;
    if (!['BOOKED', 'UNBOOKED'].includes(booking_status)) return res.status(400).json({ message: 'Invalid booking_status' });
    const [[prop]] = await db.query('SELECT owner_id FROM properties WHERE id = ?', [req.params.id]);
    if (!prop) return res.status(404).json({ message: 'Not found' });
    if (prop.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
    await db.query('UPDATE properties SET booking_status = ? WHERE id = ?', [booking_status, req.params.id]);
    res.json({ message: 'Updated', booking_status });
  } catch (e) { next(e); }
}

// DELETE /api/v1/properties/:id  (owner cannot delete VERIFIED listings; admin can, with audit log)
async function deleteProperty(req, res, next) {
  try {
    const [[prop]] = await db.query('SELECT owner_id, verification_status FROM properties WHERE id = ?', [req.params.id]);
    if (!prop) return res.status(404).json({ message: 'Not found' });
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = prop.owner_id === req.user.id;
    if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });
    if (prop.verification_status === 'VERIFIED' && !isAdmin) {
      return res.status(403).json({ message: 'Verified listings can only be deleted by Administration' });
    }
    await db.query('DELETE FROM properties WHERE id = ?', [req.params.id]);
    if (isAdmin) {
      await db.query(
        "INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES (?, 'DELETE_PROPERTY', 'PROPERTY', ?, ?)",
        [req.user.id, req.params.id, JSON.stringify({ reason: req.body?.reason || 'admin_delete' })]
      );
    }
    res.json({ message: 'Property deleted' });
  } catch (e) { next(e); }
}

// POST /api/v1/properties/:id/media  (owner; multer upload applied in route)
async function addMedia(req, res, next) {
  try {
    const [[prop]] = await db.query('SELECT owner_id FROM properties WHERE id = ?', [req.params.id]);
    if (!prop || prop.owner_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const { room_tag = 'EXTERIOR', captured_date, media_type = 'IMAGE', is_cover = false } = req.body;
    const file = req.file;
    const media_url = file ? `/uploads/${file.filename}` : req.body.media_url;
    if (!media_url) return res.status(400).json({ message: 'Provide an uploaded file or media_url' });
    await db.query(
      'INSERT INTO property_media (property_id, room_tag, media_type, media_url, captured_date, is_cover) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, room_tag, media_type, media_url, captured_date || new Date().toISOString().slice(0, 10), Boolean(is_cover)]
    );
    res.status(201).json({ message: 'Media added', media_url });
  } catch (e) { next(e); }
}

module.exports = { getProperty, myListings, createProperty, setBookingStatus, deleteProperty, addMedia };
