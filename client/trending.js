// Trending Page JavaScript

/* ===================================
   State Management
   =================================== */
const state = {
    currentUser: null,
    trendingVideos: [],
    currentFilter: 'today',
    searchQuery: ''
};

/* ===================================
   DOM Elements
   =================================== */
const elements = {
    videosGrid: document.getElementById('videosGrid'),
    emptyState: document.getElementById('emptyState'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    totalViews: document.getElementById('totalViews'),
    totalVideos: document.getElementById('totalVideos'),
    hotVideos: document.getElementById('hotVideos'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    userMenu: document.getElementById('userMenu'),
    userDropdown: document.getElementById('userDropdown'),
    userProfileBtn: document.getElementById('userProfileBtn'),
    logoutBtn: document.getElementById('logoutBtn')
};

/* ===================================
   Initialize
   =================================== */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔥 Initializing Trending Page...');
    
    try {
        await checkAuth();
        await loadUserData();
        await loadTrendingVideos('today');
        initializeEventListeners();
        
        console.log('✅ Trending page initialized');
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showToast('Failed to load trending videos', 'error');
    }
});

/* ===================================
   Authentication
   =================================== */
async function checkAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await api.getCurrentUser();
        if (!response.success) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('❌ Auth check failed:', error);
        window.location.href = 'login.html';
    }
}

async function loadUserData() {
    try {
        const response = await api.getCurrentUser();
        if (response.success) {
            state.currentUser = response.data.user;
            updateUserUI();
        }
    } catch (error) {
        console.error('❌ Failed to load user data:', error);
    }
}

function updateUserUI() {
    if (!state.currentUser) return;

    const initials = state.currentUser.username.substring(0, 2).toUpperCase();
    const avatarColor = generateColorFromString(state.currentUser.username);

    // Update avatar
    if (elements.userAvatar) {
        elements.userAvatar.textContent = initials;
        elements.userAvatar.style.backgroundColor = avatarColor;
    }

    // Update dropdown info
    if (elements.userName) {
        elements.userName.textContent = state.currentUser.username;
    }
    if (elements.userEmail) {
        elements.userEmail.textContent = state.currentUser.email;
    }
}

/* ===================================
   Load Trending Videos
   =================================== */
async function loadTrendingVideos(period = 'today') {
    showLoading(true);
    
    try {
        const response = await api.getTrendingVideos(period);
        
        if (response.success) {
            state.trendingVideos = response.data.videos || [];
            const stats = response.data.stats || {};
            
            updateStats(stats);
            displayVideos(state.trendingVideos);
            
            console.log(`✅ Loaded ${state.trendingVideos.length} trending videos`);
        } else {
            throw new Error(response.message || 'Failed to load trending videos');
        }
    } catch (error) {
        console.error('❌ Failed to load trending videos:', error);
        showEmptyState();
        showToast('Failed to load trending videos', 'error');
    } finally {
        showLoading(false);
    }
}

function updateStats(stats) {
    elements.totalViews.textContent = formatNumber(stats.totalViews || 0);
    elements.totalVideos.textContent = stats.totalVideos || 0;
    elements.hotVideos.textContent = stats.hotVideos || 0;
}

/* ===================================
   Display Videos
   =================================== */
function displayVideos(videos) {
    if (!videos || videos.length === 0) {
        showEmptyState();
        return;
    }

    elements.emptyState.style.display = 'none';
    elements.videosGrid.innerHTML = videos.map((video, index) => createVideoCard(video, index + 1)).join('');
    
    // Add click listeners
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const videoId = card.dataset.id;
            openVideoPage(videoId);
        });
    });
}

function createVideoCard(video, rank) {
    const uploader = video.uploader || {};
    const uploaderInitials = uploader.username?.substring(0, 2).toUpperCase() || 'U';
    const avatarColor = generateColorFromString(uploader.username || 'user');
    const timeAgo = getTimeAgo(new Date(video.createdAt));
    const thumbnail = video.thumbnail || null;
    const duration = video.duration ? formatDuration(video.duration) : null;

    return `
        <div class="video-card trending-card" data-id="${video.id}" data-video-id="${video.id}">
            <div class="trending-rank">#${rank}</div>
            <div class="video-thumbnail">
                ${thumbnail 
                    ? `<img src="${thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy">`
                    : `<div class="video-placeholder">
                        <i class="fas fa-video"></i>
                       </div>`
                }
                ${duration ? `<span class="video-duration">${duration}</span>` : ''}
            </div>
            <div class="video-card-content">
                <div class="avatar" style="background-color: ${avatarColor}">${uploaderInitials}</div>
                <div class="video-info">
                    <h3 class="video-title" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</h3>
                    <p class="video-uploader">${escapeHtml(uploader.username || 'Unknown')}</p>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${formatViews(video.views)}</span>
                        <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                    </div>
                    <div class="video-stats">
                        <span class="stat-item"><i class="fas fa-thumbs-up"></i> <span>${video._count?.likes || 0}</span></span>
                        <span class="stat-item"><i class="fas fa-comment"></i> <span>${video._count?.comments || 0}</span></span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function openVideoPage(videoId) {
    window.location.href = `index.html?video=${videoId}`;
}

/* ===================================
   Event Listeners
   =================================== */
function initializeEventListeners() {
    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            // Update active state
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            state.currentFilter = filter;
            loadTrendingVideos(filter);
        });
    });

    // User dropdown toggle
    if (elements.userProfileBtn) {
        elements.userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.userMenu?.classList.toggle('active');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        elements.userMenu?.classList.remove('active');
    });

    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.logout();
        });
    }

    // Upload button
    document.getElementById('uploadBtn')?.addEventListener('click', () => {
        window.location.href = 'index.html#upload';
    });
}

/* ===================================
   Loading & Empty States
   =================================== */
function showLoading(show) {
    if (show) {
        elements.videosGrid.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        `;
        elements.emptyState.style.display = 'none';
    }
}

function showEmptyState() {
    elements.videosGrid.innerHTML = '';
    elements.emptyState.style.display = 'flex';
}

function showToast(message, type = 'success') {
    const icon = elements.toast.querySelector('i');
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    icon.className = icons[type] || icons.success;
    elements.toast.style.backgroundColor = colors[type] || colors.success;
    elements.toastMessage.textContent = message;

    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

/* ===================================
   Utility Functions
   =================================== */
function generateColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const h = hash % 360;
    return `hsl(${h}, 70%, 60%)`;
}

function formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }

    return 'Just now';
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
