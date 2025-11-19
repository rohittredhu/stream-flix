module.exports = (socket, io) => {
  // Send chat message
  socket.on('chat-message', (data) => {
    const { videoId, message, username, avatar } = data;
    
    const chatMessage = {
      id: Date.now(),
      username,
      avatar,
      message,
      timestamp: new Date()
    };

    io.to(`video:${videoId}`).emit('chat-message', chatMessage);
  });

  // User typing indicator
  socket.on('typing', (data) => {
    const { videoId, username } = data;
    socket.to(`video:${videoId}`).emit('user-typing', { username });
  });

  socket.on('stop-typing', (data) => {
    const { videoId } = data;
    socket.to(`video:${videoId}`).emit('user-stop-typing');
  });
};