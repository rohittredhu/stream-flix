const { body, validationResult } = require('express-validator');
const cloudinaryService = require('../services/cloudinary.service');
const prisma = require('../config/database');
const fs = require('fs');

// Validation rules
exports.uploadValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional()
];

// Upload video - SYNCHRONOUS
exports.upload = async (req, res, next) => {
  let videoFile = null;
  let thumbnailFile = null;
  
  try {
    console.log('📤 Starting video upload...');
    console.log('📋 Request body:', req.body);
    console.log('📁 Files received:', req.files);
    console.log('👤 User ID:', req.user?.id);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    if (!req.files || !req.files.video) {
      console.error('❌ No video file provided');
      return res.status(400).json({
        success: false,
        message: 'Video file is required'
      });
    }

    if (!req.user || !req.user.id) {
      console.error('❌ User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { title, description } = req.body;
    videoFile = req.files.video[0];
    thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    console.log('📤 Upload details:', { 
      title, 
      userId: req.user.id,
      videoPath: videoFile.path,
      thumbnailPath: thumbnailFile?.path 
    });

    // Test database connection
    console.log('🔍 Testing database connection...');
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection OK');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      throw new Error('Database connection failed');
    }

    // Upload video to Cloudinary
    console.log('⏳ Uploading video to Cloudinary...');
    const videoUploadResult = await cloudinaryService.uploadVideo(videoFile.path);
    console.log('✅ Video uploaded to Cloudinary:', {
      url: videoUploadResult.url,
      cloudinaryId: videoUploadResult.cloudinaryId,
      duration: videoUploadResult.duration
    });

    // Upload thumbnail to Cloudinary (if provided)
    let thumbnailUrl = null;
    let thumbnailCloudinaryId = null;
    if (thumbnailFile) {
      console.log('⏳ Uploading thumbnail to Cloudinary...');
      try {
        const thumbnailUploadResult = await cloudinaryService.uploadImage(thumbnailFile.path);
        thumbnailUrl = thumbnailUploadResult.url;
        thumbnailCloudinaryId = thumbnailUploadResult.cloudinaryId;
        console.log('✅ Thumbnail uploaded to Cloudinary:', {
          url: thumbnailUrl,
          cloudinaryId: thumbnailCloudinaryId
        });
      } catch (thumbError) {
        console.warn('⚠️ Thumbnail upload failed (continuing without thumbnail):', thumbError.message);
      }
    }

    // Prepare video data
    const videoData = {
      title: String(title),
      description: description ? String(description) : '',
      url: String(videoUploadResult.url),
      cloudinaryId: String(videoUploadResult.cloudinaryId),
      thumbnail: thumbnailUrl ? String(thumbnailUrl) : null,
      thumbnailCloudinaryId: thumbnailCloudinaryId ? String(thumbnailCloudinaryId) : null,
      duration: parseInt(videoUploadResult.duration) || 0,
      uploaderId: String(req.user.id),
      status: 'completed',
      views: 0
    };

    console.log('📝 Video data to save:', videoData);

    // Create video record in database
    console.log('⏳ Creating video record in database...');
    const video = await prisma.video.create({
      data: videoData,
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    console.log('✅ Video record created in database:', {
      id: video.id,
      title: video.title,
      url: video.url,
      uploaderId: video.uploaderId
    });

    // Verify the video was saved
    const verifyVideo = await prisma.video.findUnique({
      where: { id: video.id }
    });
    console.log('✅ Verification - Video exists in DB:', verifyVideo ? 'YES ✓' : 'NO ✗');
    
    if (verifyVideo) {
      console.log('✅ Verified video details:', {
        id: verifyVideo.id,
        title: verifyVideo.title,
        status: verifyVideo.status
      });
    }

    // Count total videos
    const totalVideos = await prisma.video.count();
    console.log('📊 Total videos in database:', totalVideos);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: { video }
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Clean up uploaded Cloudinary files on error
    if (error.cloudinaryId) {
      try {
        await cloudinaryService.deleteVideo(error.cloudinaryId);
        console.log('🗑️ Cleaned up Cloudinary video');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup Cloudinary:', cleanupError);
      }
    }

    // Clean up local files if they still exist
    if (videoFile && fs.existsSync(videoFile.path)) {
      fs.unlinkSync(videoFile.path);
      console.log('🗑️ Cleaned up local video file');
    }
    if (thumbnailFile && fs.existsSync(thumbnailFile.path)) {
      fs.unlinkSync(thumbnailFile.path);
      console.log('🗑️ Cleaned up local thumbnail file');
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: error.message,
      details: error.stack
    });
  }
};

// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('📹 Getting videos - Page:', page, 'Limit:', limit);

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: {
          status: 'completed'
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.video.count({
        where: {
          status: 'completed'
        }
      })
    ]);

    console.log('✅ Found videos:', videos.length);
    console.log('📊 Total videos in DB:', total);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: error.message
    });
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📹 Getting video by ID:', id);

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Increment views
    await prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } }
    });

    console.log('✅ Video found:', video.title);

    res.json({
      success: true,
      data: { video }
    });
  } catch (error) {
    console.error('❌ Error getting video:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video',
      error: error.message
    });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.uploaderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this video'
      });
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: { title, description },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: { video: updatedVideo }
    });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating video',
      error: error.message
    });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await prisma.video.findUnique({
      where: { id }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.uploaderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this video'
      });
    }

    // Delete from Cloudinary
    if (video.cloudinaryId) {
      await cloudinaryService.deleteVideo(video.cloudinaryId);
    }
    if (video.thumbnailCloudinaryId) {
      await cloudinaryService.deleteImage(video.thumbnailCloudinaryId);
    }

    // Delete from database
    await prisma.video.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: error.message
    });
  }
};

// Get user videos
exports.getUserVideos = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('📹 Getting user videos for:', userId);

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: { 
          uploaderId: userId,
          status: 'completed'
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.video.count({
        where: { 
          uploaderId: userId,
          status: 'completed'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting user videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user videos',
      error: error.message
    });
  }
};

// Toggle like
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('👍 Like request - VideoId:', id, 'UserId:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId: id
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      console.log('✅ Video unliked');

      return res.json({
        success: true,
        message: 'Video unliked',
        data: { liked: false }
      });
    }

    await prisma.like.create({
      data: {
        userId,
        videoId: id
      }
    });

    console.log('✅ Video liked');

    res.json({
      success: true,
      message: 'Video liked',
      data: { liked: true }
    });
  } catch (error) {
    console.error('❌ Error liking video:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking video',
      error: error.message
    });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    console.log('💬 Comment request - VideoId:', id, 'UserId:', userId, 'Content:', content);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId,
        videoId: id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    console.log('✅ Comment added:', comment.id);

    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};