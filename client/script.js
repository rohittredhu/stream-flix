/* ===================================
   State Management
   =================================== */
const state = {
    currentUser: null,
    currentVideo: null,
    allVideos: [],
    currentFilter: 'all',
    isLoading: false,
    searchQuery: ''
};

/* ===================================
   DOM Elements
   =================================== */
const elements = {
    // Header
    header: document.querySelector('.header'),
    searchBtn: document.getElementById('searchBtn'),
    searchOverlay: document.getElementById('searchOverlay'),
    closeSearch: document.getElementById('closeSearch'),
    searchInput: document.getElementById('searchInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    uploadFromEmpty: document.getElementById('uploadFromEmpty'),
    userMenu: document.getElementById('userMenu'),
    userProfileBtn: document.getElementById('userProfileBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    mobileLogoutBtn: document.getElementById('mobileLogoutBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileSidebar: document.getElementById('mobileSidebar'),

    // Content
    videosGrid: document.getElementById('videosGrid'),
    emptyState: document.getElementById('emptyState'),
    filterBtns: document.querySelectorAll('.filter-btn'),

    // Upload Modal
    uploadModal: document.getElementById('uploadModal'),
    closeUploadModal: document.getElementById('closeUploadModal'),
    cancelUpload: document.getElementById('cancelUpload'),
    uploadForm: document.getElementById('uploadForm'),
    videoFileInput: document.getElementById('videoFile'),
    thumbnailFileInput: document.getElementById('thumbnailFile'),
    uploadProgress: document.getElementById('uploadProgress'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    submitUpload: document.getElementById('submitUpload'),

    // Video Modal
    videoModal: document.getElementById('videoModal'),
    closeVideoModal: document.getElementById('closeVideoModal'),
    videoPlayer: document.getElementById('videoPlayer'),
    videoTitle: document.querySelector('#videoModal #videoTitle'),
    videoDescription: document.querySelector('#videoModal #videoDescription'),
    videoViews: document.getElementById('videoViews'),
    videoDate: document.getElementById('videoDate'),
    uploaderName: document.getElementById('uploaderName'),
    uploaderDate: document.getElementById('uploaderDate'),
    uploaderAvatar: document.getElementById('uploaderAvatar'),
    likeBtn: document.getElementById('likeBtn'),
    likeCount: document.getElementById('likeCount'),
    commentCount: document.getElementById('commentCount'),
    commentForm: document.getElementById('commentForm'),
    commentInput: document.getElementById('commentInput'),
    commentsList: document.getElementById('commentsList'),
    commentAvatar: document.getElementById('commentAvatar'),

    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

/* ===================================
   Initialize Application
   =================================== */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing StreamFlix...');
    
    try {
        await checkAuth();
        await loadUserData();
        await loadVideos();
        initializeEventListeners();
        handleScrollHeader();
        
        console.log('✅ StreamFlix initialized successfully');
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showToast('Failed to initialize application', 'error');
    }
});

/* ===================================
   Authentication
   =================================== */
async function checkAuth() {
    if (!api.isAuthenticated()) {
        console.log('❌ User not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await api.getCurrentUser();
        if (!response.success) {
            console.log('❌ Session invalid, redirecting to login...');
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
            console.log('✅ User data loaded:', state.currentUser.username);
        }
    } catch (error) {
        console.error('❌ Failed to load user data:', error);
        showToast('Failed to load user data', 'error');
    }
}

function updateUserUI() {
    if (!state.currentUser) return;

    const initials = state.currentUser.username.substring(0, 2).toUpperCase();
    const avatarColor = generateColorFromString(state.currentUser.username);

    // Update all avatars
    document.querySelectorAll('.avatar').forEach(avatar => {
        avatar.textContent = initials;
        avatar.style.backgroundColor = avatarColor;
    });

    // Update user info in dropdowns
    const updateElements = [
        { selector: '#userName', value: state.currentUser.username },
        { selector: '#mobileUserName', value: state.currentUser.username },
        { selector: '#userEmail', value: state.currentUser.email },
        { selector: '#mobileUserEmail', value: state.currentUser.email }
    ];

    updateElements.forEach(({ selector, value }) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
    });

    console.log('✅ User UI updated');
}

function handleLogout() {
    console.log('👋 Logging out...');
    api.logout();
}

/* ===================================
   Video Management
   =================================== */
async function loadVideos(filter = 'all') {
    state.isLoading = true;
    showLoadingSkeleton();

    try {
        const response = await api.getAllVideos(1, 50);

        if (response.success && response.data.videos.length > 0) {
            state.allVideos = response.data.videos;
            applyFilter(filter);
            elements.emptyState.style.display = 'none';
            console.log(`✅ Loaded ${state.allVideos.length} videos`);
        } else {
            elements.videosGrid.innerHTML = '';
            elements.emptyState.style.display = 'flex';
            console.log('ℹ️ No videos found');
        }
    } catch (error) {
        console.error('❌ Failed to load videos:', error);
        showToast('Failed to load videos', 'error');
        elements.videosGrid.innerHTML = '';
        elements.emptyState.style.display = 'flex';
    } finally {
        state.isLoading = false;
    }
}

function applyFilter(filter) {
    state.currentFilter = filter;
    let filteredVideos = [...state.allVideos];

    switch (filter) {
        case 'recent':
            filteredVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'popular':
            filteredVideos.sort((a, b) => b.views - a.views);
            break;
        default:
            // 'all' - keep original order
            break;
    }

    displayVideos(filteredVideos);
}

function displayVideos(videos) {
    if (!videos || videos.length === 0) {
        elements.videosGrid.innerHTML = '';
        elements.emptyState.style.display = 'flex';
        return;
    }

    elements.videosGrid.innerHTML = videos.map(video => createVideoCard(video)).join('');

    // Add click event listeners
    const videoCards = elements.videosGrid.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        card.addEventListener('click', () => {
            const videoId = card.dataset.id;
            openVideoModal(videoId);
        });
    });

    console.log(`✅ Displayed ${videos.length} videos`);
}

function createVideoCard(video) {
    const uploaderInitials = video.uploader.username.substring(0, 2).toUpperCase();
    const avatarColor = generateColorFromString(video.uploader.username);
    const timeAgo = getTimeAgo(new Date(video.createdAt));
    const thumbnail = video.thumbnail || null;
    const duration = video.duration ? formatDuration(video.duration) : null;
    const isProcessing = video.status === 'processing';

    return `
        <div class="video-card" data-id="${video.id}">
            <div class="video-thumbnail">
                ${thumbnail 
                    ? `<img src="${thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy">`
                    : `<div class="video-placeholder">
                        <i class="fas fa-video"></i>
                       </div>`
                }
                ${duration ? `<span class="video-duration">${duration}</span>` : ''}
                ${isProcessing ? `<span class="video-status"><i class="fas fa-spinner fa-spin"></i> Processing...</span>` : ''}
            </div>
            <div class="video-card-content">
                <div class="avatar" style="background-color: ${avatarColor}">${uploaderInitials}</div>
                <div class="video-info">
                    <h3 class="video-title" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</h3>
                    <p class="video-uploader">${escapeHtml(video.uploader.username)}</p>
                    <div class="video-meta">
                        <span><i class="fas fa-eye"></i> ${formatViews(video.views)}</span>
                        <span><i class="fas fa-clock"></i> ${timeAgo}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showLoadingSkeleton() {
    elements.videosGrid.innerHTML = `
        <div class="loading-skeleton">
            ${Array(8).fill().map(() => '<div class="skeleton-card"></div>').join('')}
        </div>
    `;
}

/* ===================================
   Video Player Modal
   =================================== */
async function openVideoModal(videoId) {
    try {
        const response = await api.getVideoById(videoId);

        if (response.success) {
            state.currentVideo = response.data.video;
            displayVideoPlayer();
            openModal(elements.videoModal);
            
            // Increment view count (fire and forget) - check if method exists
            if (typeof api.incrementViews === 'function') {
                api.incrementViews(videoId).catch(err => 
                    console.warn('Failed to increment views:', err)
                );
            }
            
            console.log('✅ Video loaded:', state.currentVideo.title);
        } else {
            throw new Error(response.message || 'Failed to load video');
        }
    } catch (error) {
        console.error('❌ Failed to load video:', error);
        
        // Show more specific error message
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load video';
        showToast(errorMessage, 'error');
    }
}

function displayVideoPlayer() {
    if (!state.currentVideo) return;

    const video = state.currentVideo;
    const uploader = video.uploader;
    const uploaderInitials = uploader.username.substring(0, 2).toUpperCase();
    const avatarColor = generateColorFromString(uploader.username);
    const timeAgo = getTimeAgo(new Date(video.createdAt));

    // Update video player
    if (video.url) {
        elements.videoPlayer.src = video.url;
        elements.videoPlayer.load();
    }

    // Update video info
    elements.videoTitle.textContent = video.title;
    elements.videoDescription.textContent = video.description || 'No description provided';
    elements.videoViews.innerHTML = `<i class="fas fa-eye"></i> ${formatViews(video.views)} views`;
    elements.videoDate.innerHTML = `<i class="fas fa-calendar"></i> ${timeAgo}`;

    // Update uploader info
    elements.uploaderName.textContent = uploader.username;
    elements.uploaderDate.textContent = `Uploaded ${timeAgo}`;
    elements.uploaderAvatar.textContent = uploaderInitials;
    elements.uploaderAvatar.style.backgroundColor = avatarColor;

    // Update likes and comments count
    const likesCount = video._count?.likes || 0;
    const commentsCount = video.comments?.length || 0;
    
    elements.likeCount.textContent = likesCount;
    elements.commentCount.textContent = `(${commentsCount})`;

    // Check if user has liked the video
    const userLiked = video.likes?.some(like => like.userId === state.currentUser?.id);
    if (userLiked) {
        elements.likeBtn.classList.add('active');
        elements.likeBtn.querySelector('i').className = 'fas fa-thumbs-up';
    } else {
        elements.likeBtn.classList.remove('active');
        elements.likeBtn.querySelector('i').className = 'far fa-thumbs-up';
    }

    // Display comments
    displayComments(video.comments || []);

    // Update comment avatar
    if (state.currentUser) {
        const initials = state.currentUser.username.substring(0, 2).toUpperCase();
        const color = generateColorFromString(state.currentUser.username);
        elements.commentAvatar.textContent = initials;
        elements.commentAvatar.style.backgroundColor = color;
    }

    console.log('✅ Video player updated');
}

function displayComments(comments) {
    if (!comments || comments.length === 0) {
        elements.commentsList.innerHTML = `
            <p class="no-comments">
                <i class="fas fa-comments"></i>
                No comments yet. Be the first to comment!
            </p>
        `;
        return;
    }

    elements.commentsList.innerHTML = comments.map(comment => {
        const initials = comment.user.username.substring(0, 2).toUpperCase();
        const color = generateColorFromString(comment.user.username);
        const timeAgo = getTimeAgo(new Date(comment.createdAt));

        return `
            <div class="comment">
                <div class="avatar" style="background-color: ${color}">${initials}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${escapeHtml(comment.user.username)}</span>
                        <span class="comment-date">${timeAgo}</span>
                    </div>
                    <p class="comment-text">${escapeHtml(comment.content)}</p>
                </div>
            </div>
        `;
    }).join('');
}

/* ===================================
   Upload Functionality
   =================================== */
async function handleUpload(event) {
    event.preventDefault();

    const formData = new FormData(elements.uploadForm);
    const videoFile = formData.get('video');
    const thumbnailFile = formData.get('thumbnail');

    // Validate files
    if (!videoFile || videoFile.size === 0) {
        showToast('Please select a video file', 'error');
        return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > maxSize) {
        showToast('Video file is too large (max 100MB)', 'error');
        return;
    }

    try {
        // Show progress
        elements.uploadProgress.style.display = 'block';
        elements.submitUpload.disabled = true;
        updateUploadProgress(0, 'Preparing upload...');

        // Simulate upload progress (you can implement real progress tracking)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress <= 90) {
                updateUploadProgress(progress, 'Uploading...');
            }
        }, 200);

        const response = await api.uploadVideo(formData);

        clearInterval(progressInterval);
        updateUploadProgress(100, 'Upload complete!');

        if (response.success) {
            showToast('Video uploaded successfully!', 'success');
            setTimeout(() => {
                closeModal(elements.uploadModal);
                elements.uploadForm.reset();
                resetFileUploads();
                elements.uploadProgress.style.display = 'none';
                elements.submitUpload.disabled = false;
                loadVideos(state.currentFilter);
            }, 1000);
            
            console.log('✅ Video uploaded:', response.data.video.title);
        } else {
            throw new Error(response.message || 'Upload failed');
        }
    } catch (error) {
        console.error('❌ Upload failed:', error);
        showToast(error.message || 'Upload failed', 'error');
        elements.uploadProgress.style.display = 'none';
        elements.submitUpload.disabled = false;
    }
}

function updateUploadProgress(percent, text) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `${text} ${percent}%`;
}

function resetFileUploads() {
    // Reset video file upload
    const videoUpload = document.getElementById('videoFileUpload');
    if (videoUpload) {
        videoUpload.querySelector('.file-upload-placeholder').style.display = 'flex';
        videoUpload.querySelector('.file-upload-preview').style.display = 'none';
    }

    // Reset thumbnail file upload
    const thumbnailUpload = document.getElementById('thumbnailFileUpload');
    if (thumbnailUpload) {
        thumbnailUpload.querySelector('.file-upload-placeholder').style.display = 'flex';
        thumbnailUpload.querySelector('.file-upload-preview').style.display = 'none';
    }
}

/* ===================================
   Comment Functionality
   =================================== */
async function handleComment(event) {
    event.preventDefault();

    const content = elements.commentInput.value.trim();

    if (!content) {
        showToast('Please enter a comment', 'error');
        return;
    }

    if (!state.currentVideo) {
        showToast('No video selected', 'error');
        return;
    }

    const videoId = state.currentVideo.id;

    try {
        const response = await api.addComment(videoId, content);

        if (response.success) {
            elements.commentInput.value = '';
            showToast('Comment added', 'success');
            
            // Add comment to UI without reloading
            const newComment = response.data.comment;
            if (newComment) {
                // Update state
                if (!state.currentVideo.comments) {
                    state.currentVideo.comments = [];
                }
                state.currentVideo.comments.unshift(newComment);
                
                // Update comment count
                const commentCount = state.currentVideo.comments.length;
                elements.commentCount.textContent = `(${commentCount})`;
                
                // Re-render comments
                displayComments(state.currentVideo.comments);
                
                console.log('✅ Comment added');
            } else {
                // If comment data not returned, refresh the video
                await refreshCurrentVideo();
            }
        } else {
            throw new Error(response.message || 'Failed to add comment');
        }
    } catch (error) {
        console.error('❌ Comment failed:', error);
        showToast(error.message || 'Failed to add comment', 'error');
    }
}

// Helper function to refresh current video data without closing modal
async function refreshCurrentVideo() {
    if (!state.currentVideo) return;
    
    try {
        const response = await api.getVideoById(state.currentVideo.id);
        
        if (response.success) {
            state.currentVideo = response.data.video;
            
            // Update only the dynamic parts
            const video = state.currentVideo;
            
            // Update likes
            const likesCount = video._count?.likes || 0;
            elements.likeCount.textContent = likesCount;
            
            // Check if user has liked
            const userLiked = video.likes?.some(like => like.userId === state.currentUser?.id);
            if (userLiked) {
                elements.likeBtn.classList.add('active');
                elements.likeBtn.querySelector('i').className = 'fas fa-thumbs-up';
            } else {
                elements.likeBtn.classList.remove('active');
                elements.likeBtn.querySelector('i').className = 'far fa-thumbs-up';
            }
            
            // Update comments
            const commentsCount = video.comments?.length || 0;
            elements.commentCount.textContent = `(${commentsCount})`;
            displayComments(video.comments || []);
            
            console.log('✅ Video data refreshed');
        }
    } catch (error) {
        console.error('❌ Failed to refresh video:', error);
    }
}

/* ===================================
   Like Functionality
   =================================== */
async function handleLike() {
    if (!state.currentVideo) {
        showToast('No video selected', 'error');
        return;
    }

    const videoId = state.currentVideo.id;
    const likeBtn = elements.likeBtn;
    const likeCountEl = elements.likeCount;
    
    // Check current state BEFORE making changes
    const isCurrentlyLiked = likeBtn.classList.contains('active');
    const currentCount = parseInt(likeCountEl.textContent) || 0;

    // Disable button to prevent double clicks
    likeBtn.disabled = true;

    try {
        // Make API call FIRST, then update UI based on response
        const response = await api.toggleLike(videoId);

        if (response.success) {
            const { liked } = response.data;
            
            // Update UI based on server response
            if (liked) {
                // Video is now liked
                likeBtn.classList.add('active');
                likeBtn.querySelector('i').className = 'fas fa-thumbs-up';
                likeCountEl.textContent = currentCount + 1;
                console.log('✅ Video liked');
            } else {
                // Video is now unliked
                likeBtn.classList.remove('active');
                likeBtn.querySelector('i').className = 'far fa-thumbs-up';
                likeCountEl.textContent = Math.max(0, currentCount - 1);
                console.log('✅ Video unliked');
            }
            
            // Update state
            state.currentVideo._count = state.currentVideo._count || {};
            state.currentVideo._count.likes = parseInt(likeCountEl.textContent);
        } else {
            throw new Error(response.message || 'Failed to like video');
        }
    } catch (error) {
        console.error('❌ Like failed:', error);
        showToast(error.message || 'Failed to like video', 'error');
        
        // No need to revert since we didn't do optimistic update
    } finally {
        // Re-enable button
        likeBtn.disabled = false;
    }
}

/* ===================================
   Search Functionality
   =================================== */
function handleSearch() {
    const query = elements.searchInput.value.trim().toLowerCase();
    state.searchQuery = query;

    if (!query) {
        displayVideos(state.allVideos);
        return;
    }

    const filteredVideos = state.allVideos.filter(video => {
        const titleMatch = video.title.toLowerCase().includes(query);
        const uploaderMatch = video.uploader.username.toLowerCase().includes(query);
        const descriptionMatch = video.description?.toLowerCase().includes(query);
        
        return titleMatch || uploaderMatch || descriptionMatch;
    });

    displayVideos(filteredVideos);
    
    if (filteredVideos.length === 0) {
        showToast('No videos found', 'info');
    }

    console.log(`🔍 Search: "${query}" - ${filteredVideos.length} results`);
}

/* ===================================
   Share Functionality
   =================================== */
async function handleShare() {
    if (!state.currentVideo) {
        showToast('No video selected', 'error');
        return;
    }

    const videoUrl = `${window.location.origin}/video/${state.currentVideo.id}`;
    const shareData = {
        title: state.currentVideo.title,
        text: `Check out this video: ${state.currentVideo.title}`,
        url: videoUrl
    };

    // Check if Web Share API is supported
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            showToast('Shared successfully!', 'success');
            console.log('✅ Video shared via Web Share API');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Share failed:', error);
                fallbackShare(videoUrl);
            }
        }
    } else {
        // Fallback to copy to clipboard
        fallbackShare(videoUrl);
    }
}

function fallbackShare(url) {
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => {
                showToast('Link copied to clipboard!', 'success');
                console.log('✅ Link copied to clipboard');
            })
            .catch(err => {
                console.error('❌ Failed to copy:', err);
                showShareModal(url);
            });
    } else {
        showShareModal(url);
    }
}

function showShareModal(url) {
    // Create a temporary share modal
    const shareModal = document.createElement('div');
    shareModal.className = 'share-modal';
    shareModal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-header">
                <h3>Share Video</h3>
                <button class="close-share-modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="share-modal-body">
                <p>Copy this link to share:</p>
                <div class="share-url-container">
                    <input type="text" value="${url}" readonly id="shareUrlInput">
                    <button class="btn btn-primary" id="copyShareUrl">
                        <i class="fas fa-copy"></i>
                        Copy
                    </button>
                </div>
                <div class="share-social">
                    <p>Or share via:</p>
                    <div class="social-buttons">
                        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(state.currentVideo.title)}" 
                           target="_blank" class="social-btn twitter">
                            <i class="fab fa-twitter"></i>
                            Twitter
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" 
                           target="_blank" class="social-btn facebook">
                            <i class="fab fa-facebook-f"></i>
                            Facebook
                        </a>
                        <a href="https://wa.me/?text=${encodeURIComponent(state.currentVideo.title + ' ' + url)}" 
                           target="_blank" class="social-btn whatsapp">
                            <i class="fab fa-whatsapp"></i>
                            WhatsApp
                        </a>
                        <a href="mailto:?subject=${encodeURIComponent(state.currentVideo.title)}&body=${encodeURIComponent(url)}" 
                           class="social-btn email">
                            <i class="fas fa-envelope"></i>
                            Email
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(shareModal);
    
    // Show modal
    setTimeout(() => shareModal.classList.add('active'), 10);
    
    // Close button
    shareModal.querySelector('.close-share-modal').addEventListener('click', () => {
        shareModal.classList.remove('active');
        setTimeout(() => shareModal.remove(), 300);
    });
    
    // Click outside to close
    shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.classList.remove('active');
            setTimeout(() => shareModal.remove(), 300);
        }
    });
    
    // Copy button
    document.getElementById('copyShareUrl').addEventListener('click', () => {
        const input = document.getElementById('shareUrlInput');
        input.select();
        document.execCommand('copy');
        showToast('Link copied to clipboard!', 'success');
    });
}

/* ===================================
   Event Listeners
   =================================== */
function initializeEventListeners() {
    // User Menu
    if (elements.userProfileBtn) {
        elements.userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements.userMenu.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (elements.userMenu && !elements.userMenu.contains(e.target)) {
            elements.userMenu.classList.remove('active');
        }
    });

    // Logout
    [elements.logoutBtn, elements.mobileLogoutBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
    });

    // Search
    if (elements.searchBtn) {
        elements.searchBtn.addEventListener('click', () => {
            openModal(elements.searchOverlay);
            setTimeout(() => elements.searchInput?.focus(), 300);
        });
    }

    if (elements.closeSearch) {
        elements.closeSearch.addEventListener('click', () => {
            closeModal(elements.searchOverlay);
            elements.searchInput.value = '';
            if (state.searchQuery) {
                state.searchQuery = '';
                displayVideos(state.allVideos);
            }
        });
    }

    if (elements.searchInput) {
        let searchTimeout;
        elements.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(handleSearch, 300);
        });

        elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Mobile Menu
    if (elements.mobileMenuBtn) {
        elements.mobileMenuBtn.addEventListener('click', () => {
            elements.mobileSidebar.classList.toggle('active');
            elements.mobileMenuBtn.classList.toggle('active');
            document.body.style.overflow = elements.mobileSidebar.classList.contains('active') ? 'hidden' : 'auto';
        });
    }

    // Close mobile sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (elements.mobileSidebar && elements.mobileMenuBtn) {
            if (!elements.mobileSidebar.contains(e.target) && 
                !elements.mobileMenuBtn.contains(e.target) &&
                elements.mobileSidebar.classList.contains('active')) {
                elements.mobileSidebar.classList.remove('active');
                elements.mobileMenuBtn.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
    });

    // Upload Modal
    [elements.uploadBtn, elements.uploadFromEmpty].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                openModal(elements.uploadModal);
            });
        }
    });

    [elements.closeUploadModal, elements.cancelUpload].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                closeModal(elements.uploadModal);
                elements.uploadForm.reset();
                resetFileUploads();
                elements.uploadProgress.style.display = 'none';
            });
        }
    });

    if (elements.uploadForm) {
        elements.uploadForm.addEventListener('submit', handleUpload);
    }

    // File Uploads
    setupFileUpload('videoFileUpload', 'videoFile', false);
    setupFileUpload('thumbnailFileUpload', 'thumbnailFile', true);

    // Video Modal
    if (elements.closeVideoModal) {
        elements.closeVideoModal.addEventListener('click', () => {
            closeModal(elements.videoModal);
            if (elements.videoPlayer) {
                elements.videoPlayer.pause();
                elements.videoPlayer.src = '';
            }
        });
    }

    // Click outside modal to close
    [elements.uploadModal, elements.videoModal, elements.searchOverlay].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                    if (modal === elements.videoModal && elements.videoPlayer) {
                        elements.videoPlayer.pause();
                        elements.videoPlayer.src = '';
                    }
                }
            });
        }
    });

    // Comment Form
    if (elements.commentForm) {
        elements.commentForm.addEventListener('submit', handleComment);
    }

    // Like Button
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', handleLike);
    }

    // Filter Buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            applyFilter(filter);
            
            console.log(`🔽 Filter applied: ${filter}`);
        });
    });

    // Share Button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShare);
    }

    // Scroll Event
    window.addEventListener('scroll', handleScrollHeader);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key
        if (e.key === 'Escape') {
            if (elements.videoModal?.classList.contains('active')) {
                closeModal(elements.videoModal);
                if (elements.videoPlayer) {
                    elements.videoPlayer.pause();
                    elements.videoPlayer.src = '';
                }
            } else if (elements.uploadModal?.classList.contains('active')) {
                closeModal(elements.uploadModal);
            } else if (elements.searchOverlay?.classList.contains('active')) {
                closeModal(elements.searchOverlay);
            } else if (elements.mobileSidebar?.classList.contains('active')) {
                elements.mobileSidebar.classList.remove('active');
                elements.mobileMenuBtn.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }

        // Search shortcut (Ctrl/Cmd + K)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openModal(elements.searchOverlay);
            setTimeout(() => elements.searchInput?.focus(), 300);
        }
    });

    console.log('✅ Event listeners initialized');
}

/* ===================================
   File Upload Setup
   =================================== */
function setupFileUpload(containerId, inputId, isImage) {
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    
    if (!container || !input) return;

    const placeholder = container.querySelector('.file-upload-placeholder');
    const preview = container.querySelector('.file-upload-preview');
    const removeBtn = preview?.querySelector('.remove-file');

    // Click to select file
    placeholder?.addEventListener('click', () => input.click());

    // File selected
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview
        placeholder.style.display = 'none';
        preview.style.display = 'flex';

        if (isImage) {
            // Show image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = preview.querySelector('img');
                if (img) img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            // Show file name
            const fileName = preview.querySelector('.file-name');
            if (fileName) fileName.textContent = file.name;
        }
    });

    // Remove file
    removeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
    });

    // Drag and drop
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.style.borderColor = 'var(--primary)';
    });

    container.addEventListener('dragleave', () => {
        container.style.borderColor = 'var(--border)';
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.style.borderColor = 'var(--border)';
        
        const file = e.dataTransfer.files[0];
        if (file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

/* ===================================
   Modal Helpers
   =================================== */
function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

/* ===================================
   Toast Notification
   =================================== */
function showToast(message, type = 'success') {
    const icon = elements.toast.querySelector('i');
    
    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    // Set colors based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    icon.className = icons[type] || icons.success;
    icon.style.color = colors[type] || colors.success;
    elements.toastMessage.textContent = message;

    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

/* ===================================
   Scroll Handler
   =================================== */
function handleScrollHeader() {
    if (window.scrollY > 50) {
        elements.header?.classList.add('scrolled');
    } else {
        elements.header?.classList.remove('scrolled');
    }
}

/* ===================================
   Utility Functions
   =================================== */
function generateColorFromString(str) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#00f2fe', '#43e97b', '#38f9d7', '#fa709a',
        '#fee140', '#30cfd0', '#a8edea', '#fed6e3'
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

function formatDuration(seconds) {
    if (!seconds || seconds === 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views) {
    if (!views || views === 0) return '0';
    
    if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
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
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'Just now';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ===================================
   Performance Optimization
   =================================== */
// Debounce function for search
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

// Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });

    // Observe images when grid is updated
    const observeImages = () => {
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    };

    // Call when videos are loaded
    setInterval(observeImages, 1000);
}

/* ===================================
   Error Handling
   =================================== */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred', 'error');
});

/* ===================================
   Export for debugging
   =================================== */
if (window.location.hostname === 'localhost') {
    window.StreamFlix = {
        state,
        elements,
        loadVideos,
        showToast,
        openVideoModal
    };
    console.log('🐛 Debug mode: window.StreamFlix available');
}