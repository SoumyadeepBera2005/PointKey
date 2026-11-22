import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  const currentToken = localStorage.getItem('prent_token');
  if (!currentToken) return null;
  if (socket) {
    if (socket.auth?.token !== currentToken) {
      socket.auth = { token: currentToken };
      if (!socket.connected) socket.connect();
    }
    return socket;
  }
  const url = import.meta.env.VITE_SOCKET_URL || '';
  socket = io(url || undefined, {
    path: '/socket.io',
    auth: { token: currentToken },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

