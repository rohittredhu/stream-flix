class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = new Map();
        this.currentVideoId = null;
    }

    connect(userId) {
        if (this.socket && this.isConnected) {
            console.log('Already connected');
            return;
        }

        const token = localStorage.getItem('token');
        const wsUrl = 'http://localhost:3002';
        
        this.socket = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: {
                token: token
            }
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket.id);
            this.isConnected = true;
            this.reconnectAttempts = 0;

            if (userId) {
                this.socket.emit('user:join', userId);
            }

            // Rejoin video room if was watching
            if (this.currentVideoId) {
                this.joinVideo(this.currentVideoId);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error.message);
        });

        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        });

        this.setupEngagementListeners();
        this.setupNotificationListeners();
    }

    setupEngagementListeners() {
        // Like events
        this.socket.on('video:liked', (data) => {
            console.log('📥 Received video:liked', data);
            this.emit('videoLiked', data);
        });

        this.socket.on('video:unliked', (data) => {
            console.log('📥 Received video:unliked', data);
            this.emit('videoUnliked', data);
        });

        // Comment events
        this.socket.on('video:commented', (data) => {
            console.log('📥 Received video:commented', data);
            this.emit('videoCommented', data);
        });

        this.socket.on('video:comments', (data) => {
            console.log('📥 Received video:comments', data);
            this.emit('videoComments', data);
        });

        // Stats event
        this.socket.on('video:stats', (data) => {
            console.log('📥 Received video:stats', data);
            this.emit('videoStats', data);
        });
    }

    setupNotificationListeners() {
        // Video processed notification - video is ready to watch
        this.socket.on('notification', (data) => {
            console.log('📥 Received notification', data);
            this.emit('notification', data);
            
            // Emit specific event for video processed
            if (data.type === 'VIDEO_PROCESSED') {
                this.emit('videoProcessed', data);
            }
        });

        // New notification from server (real-time)
        this.socket.on('notifications:new', (data) => {
            console.log('📥 Received notifications:new', data);
            this.emit('notification', data);
            
            // Emit specific event for video processed
            if (data.type === 'VIDEO_PROCESSED') {
                this.emit('videoProcessed', data);
            }
            
            // Emit specific event for new video
            if (data.type === 'NEW_VIDEO') {
                this.emit('newVideo', data);
            }
        });

        // Unread count updates
        this.socket.on('notifications:unreadCount', (data) => {
            console.log('📥 Received notifications:unreadCount', data);
            this.emit('unreadCount', data);
        });

        // New video uploaded (from subscribed channels)
        this.socket.on('video:new', (data) => {
            console.log('📥 Received video:new', data);
            this.emit('newVideo', data);
        });
    }

    joinVideo(videoId) {
        if (this.socket && this.isConnected) {
            this.currentVideoId = videoId;
            this.socket.emit('video:join', videoId);
            console.log('📤 Joined video room:', videoId);
        }
    }

    leaveVideo(videoId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('video:leave', videoId);
            this.currentVideoId = null;
            console.log('📤 Left video room:', videoId);
        }
    }

    likeVideo(videoId, userId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('video:like', { videoId, userId });
            console.log('📤 Sent like for video:', videoId);
        }
    }

    unlikeVideo(videoId, userId) {
        if (this.socket && this.isConnected) {
            this.socket.emit('video:unlike', { videoId, userId });
            console.log('📤 Sent unlike for video:', videoId);
        }
    }

    postComment(videoId, userId, content) {
        if (this.socket && this.isConnected) {
            this.socket.emit('video:comment', { videoId, userId, content });
            console.log('📤 Sent comment for video:', videoId);
        }
    }

    getComments(videoId, page = 1) {
        if (this.socket && this.isConnected) {
            this.socket.emit('video:getComments', { videoId, page });
            console.log('📤 Requested comments for video:', videoId);
        }
    }

    // Event listener management
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in listener callback:', error);
                }
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.currentVideoId = null;
        }
    }
}

// Create singleton instance
const wsService = new WebSocketService();