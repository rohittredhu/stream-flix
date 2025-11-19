const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

class CloudinaryService {
  async uploadVideo(filePath, options = {}) {
    try {
      console.log('Uploading video to Cloudinary:', filePath);
      
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        folder: 'videos',
        chunk_size: 6000000,
        ...options
      });

      // Delete local file after upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log('Video uploaded successfully:', result.public_id);

      return {
        url: result.secure_url,
        cloudinaryId: result.public_id,
        duration: Math.round(result.duration)
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  async uploadImage(filePath, options = {}) {
    try {
      console.log('Uploading image to Cloudinary:', filePath);
      
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'image',
        folder: 'thumbnails',
        ...options
      });

      // Delete local file after upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log('Image uploaded successfully:', result.public_id);

      return {
        url: result.secure_url,
        cloudinaryId: result.public_id
      };
    } catch (error) {
      console.error('Cloudinary image upload error:', error);
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  async deleteVideo(cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(cloudinaryId, { resource_type: 'video' });
      console.log('Video deleted from Cloudinary:', cloudinaryId);
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  async deleteImage(cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(cloudinaryId, { resource_type: 'image' });
      console.log('Image deleted from Cloudinary:', cloudinaryId);
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }
}

module.exports = new CloudinaryService();