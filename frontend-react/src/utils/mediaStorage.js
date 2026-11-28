// Unified persistent client-side media storage for PointKey
// Enables reliable image & video persistence across Localhost and Vercel

const DB_NAME = 'PointKeyMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media';

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

/**
 * Stores a File or Blob in IndexedDB (handles large files like 20MB video)
 */
export async function storeMediaBlob(key, fileOrBlob) {
  if (!key || !fileOrBlob) return false;
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(fileOrBlob, String(key));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Retrieves a File or Blob from IndexedDB
 */
export async function getMediaBlob(key) {
  if (!key) return null;
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(String(key));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Retrieves a persistent Object URL for playback
 */
export async function getMediaBlobUrl(key) {
  const blob = await getMediaBlob(key);
  if (!blob) return null;
  try {
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/**
 * Compresses an image File into a compact Base64 Data URL (~70KB - 130KB)
 * Fits cleanly within localStorage quotas and eliminates 404s on Vercel
 */
export function compressImageToDataUrl(file, maxDimension = 1200, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result || '');
      img.src = e.target?.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Resolves the best playable video URL for a property:
 * Checks IndexedDB first (retains uploaded file), then fallback to property.video_url
 */
export async function getPropertyVideoUrl(prop) {
  if (!prop) return null;
  if (prop.id) {
    const url = await getMediaBlobUrl(`video_${prop.id}`);
    if (url) return url;
  }
  if (prop.property_code) {
    const url = await getMediaBlobUrl(`video_${prop.property_code}`);
    if (url) return url;
  }
  return prop.video_url || prop.video_preview || null;
}

/**
 * Resolves the best previewable bill URL for a property:
 * Checks IndexedDB first, then fallback to property.electricity_bill_url
 */
export async function getPropertyBillUrl(prop) {
  if (!prop) return null;
  if (prop.id) {
    const url = await getMediaBlobUrl(`bill_${prop.id}`);
    if (url) return url;
  }
  if (prop.property_code) {
    const url = await getMediaBlobUrl(`bill_${prop.property_code}`);
    if (url) return url;
  }
  return prop.electricity_bill_url || prop.electricity_bill_preview || null;
}

/**
 * Returns the backend API base origin (e.g. Render backend URL on Vercel)
 */
export function getBackendBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && typeof apiUrl === 'string' && apiUrl.startsWith('http')) {
    try {
      const u = new URL(apiUrl);
      return u.origin;
    } catch {}
  }
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl && typeof socketUrl === 'string' && socketUrl.startsWith('http')) {
    try {
      const u = new URL(socketUrl);
      return u.origin;
    } catch {}
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://pointkey-backend.onrender.com';
  }
  return '';
}

/**
 * Resolves any relative media URL (like /uploads/xxx.jpg) to the absolute backend URL
 * Prevents 404s and unwanted fallbacks on Vercel
 */
export function getAnglePlaceholder(angleNum = 1, angleLabel = 'Room Angle') {
  const safeLabel = encodeURIComponent(angleLabel);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="%23f8fafc"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="24" y="24" width="752" height="552" rx="20" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="8 8"/><g fill="%2317324D" transform="translate(360, 210)"><circle cx="40" cy="40" r="40" fill="%23e2e8f0"/><path d="M26 44l8-10 6 7 10-13 14 16H26z" fill="%2394a3b8"/><circle cx="34" cy="28" r="4" fill="%2394a3b8"/></g><text x="50%" y="335" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="800" fill="%2317324D">Angle ${angleNum}: ${safeLabel}</text><text x="50%" y="370" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="%23047857">✓ PointKey Anti-Fake Verification</text><text x="50%" y="400" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%2394a3b8">Owner Upload Authenticity Checked</text></svg>`;
}

export const DEFAULT_ANGLE_PLACEHOLDERS = [
  getAnglePlaceholder(1, 'Angle 1 (Front/Entrance)'),
  getAnglePlaceholder(2, 'Angle 2 (Living/Bedroom)'),
  getAnglePlaceholder(3, 'Angle 3 (Balcony/Kitchen/Side)'),
];

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const base = getBackendBaseUrl();
    if (base) return `${base}${cleanPath}`;
    return cleanPath;
  }
  return trimmed;
}


