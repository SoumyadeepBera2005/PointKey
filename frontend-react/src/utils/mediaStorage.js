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

