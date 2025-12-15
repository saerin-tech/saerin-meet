require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeBucket } = require('./utils/minio');

const app = express();

// Create recordings directory if it doesn't exist (for local fallback)
const recordingsPath = path.resolve(process.env.RECORDINGS_PATH || './recordings');
if (!fs.existsSync(recordingsPath)) {
  fs.mkdirSync(recordingsPath, { recursive: true });
}

console.log('📁 Recordings directory:', recordingsPath);

// Initialize MinIO
initializeBucket().catch(err => {
  console.error('⚠️  MinIO initialization failed:', err.message);
  console.log('⚠️  Falling back to local file storage');
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for recordings
app.use('/recordings', express.static(recordingsPath));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saerinmeet', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/recordings', require('./routes/recordings'));
app.use('/api/users', require('./routes/users'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SaerinMeet server is running',
    livekit: {
      configured: !!(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET)
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

