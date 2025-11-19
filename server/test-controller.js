const videoController = require('./controllers/videoController');

console.log('Video Controller:', videoController);
console.log('getAllVideos:', typeof videoController.getAllVideos);
console.log('getVideoById:', typeof videoController.getVideoById);
console.log('getUserVideos:', typeof videoController.getUserVideos);
console.log('uploadVideo:', typeof videoController.uploadVideo);
console.log('updateVideo:', typeof videoController.updateVideo);
console.log('deleteVideo:', typeof videoController.deleteVideo);
console.log('likeVideo:', typeof videoController.likeVideo);
console.log('addComment:', typeof videoController.addComment);