const cloudinary = require('../config/cloudinary');
const streamifier = require('stream').PassThrough;

const bufferToStream = (buffer) => {
  const stream = new streamifier();
  stream.end(buffer);
  return stream;
};

const uploadToCloudinary = (fileBuffer, folder = 'miniki-fashion') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (result) {
          resolve({ url: result.secure_url, public_id: result.public_id });
        } else {
          reject(error);
        }
      }
    );
    bufferToStream(fileBuffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
