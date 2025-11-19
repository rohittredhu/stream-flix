const prisma = require('../config/database');
const cacheService = require('./cache.service');
const pubsubService = require('./pubsub.service');

class VideoService {
  async createVideo(data) {
    const video = await prisma.video.create({
      data,
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

    await cacheService.delPattern('videos:*');
    await pubsubService.publish('video:created', video);

    return video;
  }

  async getVideoById(id) {
    const cacheKey = `video:${id}`;
    let video = await cacheService.get(cacheKey);

    if (!video) {
      video = await prisma.video.findUnique({
        where: { id },
        include: {
          uploader: {
            select: {
              id: true,
              username: true,
              avatar: true,
              bio: true
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
            },
            take: 50
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      });

      if (video) {
        await cacheService.set(cacheKey, video, 3600);
      }
    }

    return video;
  }

  async getAllVideos(page = 1, limit = 10, status = 'ready') {
    const skip = (page - 1) * limit;
    const cacheKey = `videos:page:${page}:limit:${limit}:status:${status}`;
    
    let result = await cacheService.get(cacheKey);

    if (!result) {
      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          skip,
          take: limit,
          where: {
            status
          },
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
          where: { status }
        })
      ]);

      result = {
        videos,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      await cacheService.set(cacheKey, result, 600);
    }

    return result;
  }

  async updateVideo(id, data) {
    const video = await prisma.video.update({
      where: { id },
      data,
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

    await cacheService.del(`video:${id}`);
    await cacheService.delPattern('videos:*');
    await pubsubService.publish('video:updated', video);

    return video;
  }

  async deleteVideo(id) {
    const video = await prisma.video.delete({
      where: { id }
    });

    await cacheService.del(`video:${id}`);
    await cacheService.delPattern('videos:*');
    await pubsubService.publish('video:deleted', { id });

    return video;
  }

  async incrementViews(id) {
    const video = await prisma.video.update({
      where: { id },
      data: {
        views: {
          increment: 1
        }
      }
    });

    await cacheService.del(`video:${id}`);
    return video;
  }

  async getUserVideos(uploaderId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        skip,
        take: limit,
        where: { uploaderId },
        include: {
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
        where: { uploaderId }
      })
    ]);

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async toggleLike(videoId, userId) {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      await cacheService.del(`video:${videoId}`);
      return { liked: false };
    } else {
      await prisma.like.create({
        data: {
          userId,
          videoId
        }
      });
      await cacheService.del(`video:${videoId}`);
      return { liked: true };
    }
  }

  async addComment(videoId, userId, content) {
    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        videoId
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

    await cacheService.del(`video:${videoId}`);
    await pubsubService.publish('comment:added', comment);

    return comment;
  }
}

module.exports = new VideoService();