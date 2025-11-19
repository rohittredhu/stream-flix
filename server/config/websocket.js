const { Server } = require('socket.io');

let io = null;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/', // Explicit path for WebSocket only
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  console.log('✅ WebSocket initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

module.exports = { initializeWebSocket, getIO };