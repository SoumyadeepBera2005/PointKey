const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Socket.io chat handler — real-time tenant <-> owner messaging.
 * Client connects with ?token=<jwt>. Rooms are scoped per property:
 *   join room `property:<id>` after server validates participants.
 * Messages are persisted to chat_messages.
 */
function registerChatHandler(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || 'change_me_super_secret');
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    // প্রতিটি কানেক্টেড ইউজারকে তার নিজস্ব রুম `user:<id>`-তে জয়েন করানো হয়
    socket.join(`user:${userId}`);
    console.log(`[Socket] User ${userId} connected and joined room user:${userId}`);

    socket.on('join:property', async ({ propertyId }) => {
      // Only the property owner or an interested tenant may join
      const [[prop]] = await db.query('SELECT owner_id FROM properties WHERE id = ?', [propertyId]).catch(() => [[null]]);
      if (!prop) return socket.emit('error:message', 'Property not found');
      socket.join(`property:${propertyId}`);
      socket.emit('joined', { propertyId });
    });

    socket.on('message:send', async ({ propertyId, receiverId, message }) => {
      const text = String(message || '').trim();
      if (!propertyId || !receiverId || !text) return;
      try {
        await db.query(
          'INSERT INTO chat_messages (id, property_id, sender_id, receiver_id, message) VALUES (UUID(), ?, ?, ?, ?)',
          [propertyId, userId, receiverId, text]
        );
        const payload = { propertyId, senderId: userId, receiverId, message: text, createdAt: new Date().toISOString() };
        io.to(`property:${propertyId}`).emit('message:new', payload);
      } catch (e) {
        socket.emit('error:message', 'Failed to send message');
      }
    });

    socket.on('message:history', async ({ propertyId, withUserId }) => {
      const [rows] = await db.query(
        `SELECT id, sender_id, receiver_id, message, read_at, created_at FROM chat_messages
         WHERE property_id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
         ORDER BY created_at ASC LIMIT 200`,
        [propertyId, userId, withUserId, withUserId, userId]
      ).catch(() => [[]]);
      socket.emit('message:history', { propertyId, messages: rows });
    });
  });
}

module.exports = { registerChatHandler };
