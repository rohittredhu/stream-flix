const streamHandler = require('./handlers/stream.handler');
const chatHandler = require('./handlers/chat.handler');
const pubsubService = require('../services/pubsub.service');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join video room
    socket.on('join-video', (videoId) => {
      socket.join(`video:${videoId}`);
      console.log(`📺 User ${socket.id} joined video room: ${videoId}`);
    });

    // Leave video room
    socket.on('leave-video', (videoId) => {
      socket.leave(`video:${videoId}`);
      console.log(`📺 User ${socket.id} left video room: ${videoId}`);
    });

    // Stream handlers
    streamHandler(socket, io);

    // Chat handlers
    chatHandler(socket, io);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Subscribe to video processing events
  pubsubService.subscribe('video:processed', (data) => {
    io.to(`video:${data.videoId}`).emit('video-processed', data);
  });

  pubsubService.subscribe('video:processing-failed', (data) => {
    io.to(`video:${data.videoId}`).emit('video-processing-failed', data);
  });

  pubsubService.subscribe('comment:added', (data) => {
    io.to(`video:${data.videoId}`).emit('new-comment', data);
  });
};