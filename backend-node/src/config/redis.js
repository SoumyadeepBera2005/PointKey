const Redis = require('ioredis');

const url = process.env.REDIS_URL || 'redis://localhost:6379';
let redis = null;
try {
  redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
  redis.on('error', () => { /* degrade gracefully: app works without Redis */ });
  redis.connect().catch(() => {});
} catch (_) {
  redis = null;
}

/**
 * In-memory fallback so OTP works even when Redis is not installed/running
 * (single-process dev setups). Keys carry their own expiry timestamps.
 */
const memStore = new Map();
function memGet(key) {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (entry.exp <= Date.now()) { memStore.delete(key); return null; }
  return entry.val;
}
function memSet(key, value, ttlSeconds) {
  memStore.set(key, { val: String(value), exp: Date.now() + ttlSeconds * 1000 });
}
// Opportunistic sweep to avoid unbounded growth of the fallback map.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memStore) if (v.exp <= now) memStore.delete(k);
}, 60 * 1000).unref();

/** Best-effort cache helpers — never throw when Redis is unavailable. */
async function cacheGet(key) {
  try { const v = redis ? await redis.get(key) : null; if (v !== null && v !== undefined) return v; } catch { /* fall through */ }
  return memGet(key);
}
async function cacheSet(key, value, ttlSeconds = 60) {
  try { if (redis) await redis.set(key, value, 'EX', ttlSeconds); } catch { /* fall through */ }
  memSet(key, value, ttlSeconds);
}
async function cacheDel(key) {
  try { if (redis) await redis.del(key); } catch { /* best effort */ }
  memStore.delete(key);
}

module.exports = { redis, cacheGet, cacheSet, cacheDel };
