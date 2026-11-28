require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const visitRoutes = require('./routes/visitRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { registerChatHandler } = require('./sockets/chatHandler');
const { uploadMiddleware, uploadDir } = require('./middlewares/uploadMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] },
});
registerChatHandler(io);
app.set('io', io);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(uploadDir));

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', service: 'prent-backend', time: new Date().toISOString() }));

// Universal media & verification document upload
app.post('/api/v1/upload', uploadMiddleware.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/notifications', (req, res, next) => {
  req.url = '/notifications' + req.url;
  authRoutes(req, res, next);
});
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', adminRoutes); // /ratings, /reports, /admin/*, /owner/face-verify

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT || 5000);
server.listen(PORT, '0.0.0.0', () => console.log(`PointKey API listening on http://127.0.0.1:${PORT} [SMTP: ${process.env.EMAIL_SMTP_USER || 'none'}]`));
