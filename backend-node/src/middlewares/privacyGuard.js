const db = require('../config/db');

/**
 * Privacy guard: exact address + owner contact details are only sent to the
 * frontend when the tenant has a SUCCESS (or REFUND_REQUESTED) payment for
 * this property, or the requester is the owner/admin.
 * Attaches req.isPropertyUnlocked.
 */
async function applyPropertyPrivacy(req, res, next) {
  try {
    const propertyId = req.params.id;
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : 'GUEST';

    let isUnlocked = false;

    if (userRole === 'ADMIN') {
      isUnlocked = true;
    } else if (userRole === 'OWNER' && userId) {
      const [[prop]] = await db.query('SELECT owner_id FROM properties WHERE id = ?', [propertyId]);
      isUnlocked = Boolean(prop && prop.owner_id === userId);
    } else if (userId) {
      const [payments] = await db.query(
        `SELECT id FROM payments
         WHERE payer_id = ? AND property_id = ? AND status IN ('SUCCESS','REFUND_REQUESTED','REFUNDED')
         LIMIT 1`,
        [userId, propertyId]
      );
      isUnlocked = payments.length > 0;
    }

    req.isPropertyUnlocked = isUnlocked;
    next();
  } catch (error) {
    next(error);
  }
}

/** Strip private fields from a property row based on req.isPropertyUnlocked and user role */
function maskProperty(property, isUnlocked, user = null) {
  if (!property) return property;
  const masked = { ...property };

  const isAdmin = user && user.role === 'ADMIN';
  const isOwner = user && (user.id === property.owner_id || user.id === property.ownerId);

  // Electricity bill and raw verification video are ALWAYS hidden from public tenants
  if (!isAdmin && !isOwner) {
    masked.electricity_bill_url = null;
    masked.electricity_bill_name = null;
    masked.electricity_bill_uploaded = false;
    masked.video_url = null; // hide raw owner video from public tenants
  }

  if (isUnlocked) return masked;
  masked.exact_address = null;
  masked.location = null; // never leak lat/lng pre-payment
  masked.owner_phone = null;
  masked.owner_whatsapp = null;
  masked.owner_email = null;
  masked.privacy_locked = true;
  return masked;
}

module.exports = { applyPropertyPrivacy, maskProperty };
