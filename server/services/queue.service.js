const Bull = require('bull');

const videoProcessingQueue = new Bull('video-processing', {
  redis: process.env.REDIS_URL
});

videoProcessingQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

videoProcessingQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

videoProcessingQueue.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

module.exports = { videoProcessingQueue };