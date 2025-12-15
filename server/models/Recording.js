const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  roomName: {
    type: String,
    required: true
  },
  egressId: {
    type: String,
    required: false // LiveKit egress ID
  },
  filePath: {
    type: String,
    required: false
  },
  fileUrl: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'recording', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  error: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
});

module.exports = mongoose.model('Recording', recordingSchema);
