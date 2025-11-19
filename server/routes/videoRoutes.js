const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Public routes
router.get('/user/:userId', videoController.getUserVideos);
router.get('/:id', videoController.getVideoById);
router.get('/', videoController.getAllVideos);

// Protected routes
router.post('/upload', 
  authMiddleware, 
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  videoController.upload
);

router.put('/:id', authMiddleware, videoController.updateVideo);
router.delete('/:id', authMiddleware, videoController.deleteVideo);
router.post('/:id/like', authMiddleware, videoController.toggleLike);
router.post('/:id/comment', authMiddleware, videoController.addComment);

module.exports = router;