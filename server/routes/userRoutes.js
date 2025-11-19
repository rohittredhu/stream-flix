const express = require('express');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Public routes
router.get('/:userId', UserController.getProfile);

// Protected routes
router.put(
  '/profile',
  authMiddleware,
  upload.single('avatar'),
  UserController.updateProfile
);
router.post('/change-password', authMiddleware, UserController.changePassword);
router.get('/liked-videos', authMiddleware, UserController.getLikedVideos);

module.exports = router;