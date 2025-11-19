require('dotenv').config();
const { videoProcessingQueue } = require('../../services/queue.service');
const cloudinaryService = require('../../services/cloudinary.service');
const videoService = require('../../services/video.service');
const pubsubService = require('../../services/pubsub.service');

videoProcessingQueue.process('process-video', async (job) => {
  const { videoId, filePath, thumbnailPath } = job.data;

  try {
    console.log(`🎬 Processing video: ${videoId}`);
    job.progress(10);

    // Upload video to Cloudinary
    console.log('📤 Uploading video to Cloudinary...');
    const videoResult = await cloudinaryService.uploadVideo(filePath);
    job.progress(50);

    // Upload thumbnail if exists
    let thumbnailResult = null;
    if (thumbnailPath) {
      console.log('📤 Uploading thumbnail to Cloudinary...');
      thumbnailResult = await cloudinaryService.uploadImage(thumbnailPath);
    }
    job.progress(70);

    // Update video in database
    console.log('💾 Updating video in database...');
    const updatedVideo = await videoService.updateVideo(videoId, {
      url: videoResult.url,
      cloudinaryId: videoResult.cloudinaryId,
      duration: videoResult.duration,
      thumbnail: thumbnailResult?.url,
      status: 'ready'
    });
    job.progress(90);

    // Publish event
    await pubsubService.publish('video:processed', {
      videoId,
      status: 'ready',
      video: updatedVideo
    });

    job.progress(100);
    console.log(`✅ Video processed successfully: ${videoId}`);

    return updatedVideo;
  } catch (error) {
    console.error(`❌ Video processing error for ${videoId}:`, error);

    // Update video status to failed
    await videoService.updateVideo(videoId, {
      status: 'failed'
    });

    // Publish failure event
    await pubsubService.publish('video:processing-failed', {
      videoId,
      error: error.message
    });

    throw error;
  }
});

console.log('🚀 Video processing worker started and waiting for jobs...');