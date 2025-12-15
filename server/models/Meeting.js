const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  }
});

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  roomName: {
    type: String,
    required: true,
    unique: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: false
  },
  duration: {
    type: Number, // expected duration in minutes
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  isRecording: {
    type: Boolean,
    default: false
  },
  participants: [participantSchema],
  settings: {
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    muteOnEntry: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 100
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
});

// Generate unique room name
meetingSchema.statics.generateRoomName = function() {
  return 'room-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

module.exports = mongoose.model('Meeting', meetingSchema);
