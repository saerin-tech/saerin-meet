const Minio = require('minio');

// Initialize MinIO Client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'recordings';

// Initialize bucket on startup
async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' created successfully`);
    } else {
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' already exists`);
    }
  } catch (error) {
    console.error('❌ Error initializing MinIO bucket:', error);
    throw error;
  }
}

// Get a presigned URL for downloading a file
async function getPresignedUrl(filename, expirySeconds = 3600) {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, filename, expirySeconds);
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

// Check if a file exists in MinIO
async function fileExists(filename) {
  try {
    await minioClient.statObject(BUCKET_NAME, filename);
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

// Get file stats (size, metadata)
async function getFileStats(filename) {
  try {
    const stats = await minioClient.statObject(BUCKET_NAME, filename);
    return {
      size: stats.size,
      etag: stats.etag,
      lastModified: stats.lastModified,
      metaData: stats.metaData
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    throw error;
  }
}

// Delete a file from MinIO
async function deleteFile(filename) {
  try {
    await minioClient.removeObject(BUCKET_NAME, filename);
    console.log(`Deleted file from MinIO: ${filename}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw error;
  }
}

// Stream a file from MinIO
async function getFileStream(filename) {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, filename);
    return stream;
  } catch (error) {
    console.error('Error getting file stream:', error);
    throw error;
  }
}

module.exports = {
  minioClient,
  initializeBucket,
  getPresignedUrl,
  fileExists,
  getFileStats,
  deleteFile,
  getFileStream,
  BUCKET_NAME
};
