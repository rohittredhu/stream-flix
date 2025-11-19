const { videoProcessingQueue } = require('../services/queue.service');

const addVideoProcessingJob = async (videoData) => {
  try {
    const job = await videoProcessingQueue.add('process-video', videoData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    });
    
    console.log(`📥 Video processing job added: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Error adding job to queue:', error);
    throw error;
  }
};

const getJobStatus = async (jobId) => {
  try {
    const job = await videoProcessingQueue.getJob(jobId);
    if (!job) return null;
    
    const state = await job.getState();
    return {
      id: job.id,
      state,
      progress: job.progress(),
      data: job.data
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
};

module.exports = { addVideoProcessingJob, getJobStatus };