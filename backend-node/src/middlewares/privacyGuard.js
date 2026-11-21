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

/** Strip private fields from a property row based on req.isPropertyUnlocked */
function maskProperty(property, isUnlocked) {
  if (isUnlocked || !property) return property;
  const masked = { ...property };
  masked.exact_address = null;
  masked.location = null; // never leak lat/lng pre-payment
  masked.owner_phone = null;
  masked.owner_whatsapp = null;
  masked.owner_email = null;
  masked.privacy_locked = true;
  return masked;
}

module.exports = { applyPropertyPrivacy, maskProperty };
