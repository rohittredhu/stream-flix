require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { connectRedis } = require('./config/redis');
const { initializeWebSocket } = require('./config/websocket');
const errorMiddleware = require('./middleware/error.middleware');
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const userRoutes = require('./routes/userRoutes');
const websocketHandlers = require('./websockets');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

// CORS - Must be BEFORE routes
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers - BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Initialize Redis
connectRedis().catch(console.error);

// HTTP Routes - BEFORE WebSocket
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

// Error middleware
app.use(errorMiddleware);

// Initialize WebSocket AFTER all HTTP routes
const io = initializeWebSocket(server);
websocketHandlers(io);

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ WebSocket ready on ws://localhost:${PORT}`);
});

module.exports = { app, server, io };