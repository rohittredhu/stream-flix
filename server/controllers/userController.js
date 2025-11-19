const prisma = require('../config/database');
const cloudinaryService = require('../services/cloudinary.service');
const bcrypt = require('bcryptjs');

class UserController {
  // Get user profile
  static async getProfile(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              videos: true,
              comments: true,
              likes: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update profile
  static async updateProfile(req, res, next) {
    try {
      const { username, bio } = req.body;

      const updateData = {};
      if (username) updateData.username = username;
      if (bio !== undefined) updateData.bio = bio;

      // Handle avatar upload
      if (req.file) {
        const avatarResult = await cloudinaryService.uploadImage(req.file.path);
        updateData.avatar = avatarResult.url;
      }

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          avatar: true,
          bio: true,
          createdAt: true
        }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters'
        });
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's liked videos
  static async getLikedVideos(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [likes, total] = await Promise.all([
        prisma.like.findMany({
          skip,
          take: limit,
          where: { userId: req.user.id },
          include: {
            video: {
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
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.like.count({
          where: { userId: req.user.id }
        })
      ]);

      const videos = likes.map(like => like.video);

      res.json({
        success: true,
        data: {
          videos,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;