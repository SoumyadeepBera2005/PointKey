import { getSocket } from './socket';

// Universal HTML5 BroadcastChannel for instantaneous zero-refresh cross-tab communication
const CHANNEL_NAME = 'pointkey_realtime_channel';
let broadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('BroadcastChannel initialization fallback:', err);
  }
}

/**
 * Publish a real-time event across ALL browser tabs and the current window
 * @param {string} type - 'NEW_PROPERTY' | 'PROPERTY_STATUS' | 'USER_UPDATED' | 'PROPERTY_VERIFIED'
 * @param {any} payload - Event data
 */
export function publishRealtime(type, payload) {
  const message = { type, payload, timestamp: Date.now() };

  // 1. Broadcast to other browser tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch {}
  }

  // 2. Local window event
  window.dispatchEvent(new CustomEvent(`pk_${type.toLowerCase()}`, { detail: payload }));
  window.dispatchEvent(new CustomEvent('pk_realtime_event', { detail: message }));

  // 3. Fallback timestamp ping in localStorage so standard storage events trigger
  try {
    localStorage.setItem('pk_sync_ping', String(Date.now()));
  } catch {}
}

/**
 * Subscribe to real-time events across tabs, windows, and socket.io
 * @param {Function} handler - (event: { type, payload }) => void
 * @returns {Function} unsubscribe cleanup function
 */
export function subscribeRealtime(handler) {
  if (typeof window === 'undefined') return () => {};

  // 1. BroadcastChannel listener (Other tabs)
  const onBroadcastMessage = (event) => {
    if (event?.data) {
      handler(event.data);
    }
  };
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', onBroadcastMessage);
  }

  // 2. Same-window event listener
  const onLocalEvent = (customEvent) => {
    if (customEvent?.detail) {
      handler(customEvent.detail);
    }
  };
  window.addEventListener('pk_realtime_event', onLocalEvent);

  // 3. Storage event fallback
  const onStorageChange = (e) => {
    if (e.key === 'pk_sync_ping' || e.key?.startsWith('prent_')) {
      handler({ type: 'STORAGE_SYNC', payload: e.key });
    }
  };
  window.addEventListener('storage', onStorageChange);

  // 4. Socket.io listener (Real-time server events)
  const socket = getSocket();
  const onSocketNewProp = (data) => handler({ type: 'NEW_PROPERTY', payload: data });
  const onSocketStatus = (data) => handler({ type: 'PROPERTY_STATUS', payload: data });
  const onSocketSync = (data) => handler({ type: 'PROPERTY_SYNC', payload: data });

  if (socket) {
    socket.on('new_property_submitted', onSocketNewProp);
    socket.on('property_status_changed', onSocketStatus);
    socket.on('property_sync', onSocketSync);
  }

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', onBroadcastMessage);
    }
    window.removeEventListener('pk_realtime_event', onLocalEvent);
    window.removeEventListener('storage', onStorageChange);
    if (socket) {
      socket.off('new_property_submitted', onSocketNewProp);
      socket.off('property_status_changed', onSocketStatus);
      socket.off('property_sync', onSocketSync);
    }
  };
}
