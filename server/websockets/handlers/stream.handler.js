module.exports = (socket, io) => {
  // Stream quality change
  socket.on('stream-quality-change', (data) => {
    const { videoId, quality } = data;
    socket.to(`video:${videoId}`).emit('quality-changed', { quality });
  });

  // Stream playback state
  socket.on('stream-playback', (data) => {
    const { videoId, state, timestamp } = data;
    socket.to(`video:${videoId}`).emit('playback-state', { state, timestamp });
  });

  // Viewer count update
  socket.on('viewer-joined', (videoId) => {
    io.to(`video:${videoId}`).emit('viewer-count-update', {
      count: io.sockets.adapter.rooms.get(`video:${videoId}`)?.size || 0
    });
  });

  socket.on('viewer-left', (videoId) => {
    io.to(`video:${videoId}`).emit('viewer-count-update', {
      count: io.sockets.adapter.rooms.get(`video:${videoId}`)?.size || 0
    });
  });
};