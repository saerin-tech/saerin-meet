const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Meeting = require('../models/Meeting');
const Recording = require('../models/Recording');

// Create a new meeting
router.post('/', authMiddleware, [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('scheduledTime').optional().isISO8601().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, scheduledTime, duration, settings } = req.body;
    
    const meeting = new Meeting({
      title,
      description,
      roomName: Meeting.generateRoomName(),
      hostId: req.user._id,
      scheduledTime,
      duration: duration || 60,
      settings: settings || {}
    });

    await meeting.save();
    await meeting.populate('hostId', 'name email');

    res.status(201).json({ meeting });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all meetings for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = {
      $or: [
        { hostId: req.user._id },
        { 'participants.userId': req.user._id }
      ]
    };

    if (status) {
      query.status = status;
    }

    const meetings = await Meeting.find(query)
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Meeting.countDocuments(query);

    res.json({
      meetings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get meeting by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('hostId', 'name email')
      .populate('participants.userId', 'name email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ meeting });
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get meeting by room name (for joining)
router.get('/room/:roomName', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomName: req.params.roomName })
      .populate('hostId', 'name email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ meeting });
  } catch (error) {
    console.error('Get meeting by room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate LiveKit token for joining meeting
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if meeting is active or can be started
    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      return res.status(400).json({ message: 'Meeting has ended' });
    }

    // Update meeting status to active if host is joining
    if (meeting.hostId.toString() === req.user._id.toString() && meeting.status === 'scheduled') {
      meeting.status = 'active';
      meeting.startedAt = new Date();
      await meeting.save();
    }

    // Add participant if not already added
    const existingParticipant = meeting.participants.find(
      p => p.userId && p.userId.toString() === req.user._id.toString()
    );

    if (!existingParticipant) {
      meeting.participants.push({
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        joinedAt: new Date()
      });
      await meeting.save();
    }

    // Create LiveKit access token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: req.user._id.toString(),
        name: req.user.name,
        metadata: JSON.stringify({
          email: req.user.email,
          isHost: meeting.hostId.toString() === req.user._id.toString()
        })
      }
    );

    at.addGrant({
      roomJoin: true,
      room: meeting.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = await at.toJwt();

    res.json({
      token,
      meeting: {
        id: meeting._id,
        title: meeting.title,
        roomName: meeting.roomName,
        isHost: meeting.hostId.toString() === req.user._id.toString()
      },
      liveKitUrl: process.env.LIVEKIT_URL
    });
  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update meeting
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only host can update meeting
    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can update meeting' });
    }

    const { title, description, scheduledTime, duration, settings, status } = req.body;

    if (title) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (scheduledTime) meeting.scheduledTime = scheduledTime;
    if (duration) meeting.duration = duration;
    if (settings) meeting.settings = { ...meeting.settings, ...settings };
    if (status) meeting.status = status;

    if (status === 'ended' && !meeting.endedAt) {
      meeting.endedAt = new Date();
      
      // Auto-stop any active recordings for this meeting
      try {
        const activeRecordings = await Recording.find({
          meetingId: meeting._id,
          status: { $in: ['recording', 'pending'] }
        });

        if (activeRecordings.length > 0) {
          const { EgressClient } = require('livekit-server-sdk');
          const egressClient = new EgressClient(
            process.env.LIVEKIT_URL,
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET
          );

          for (const recording of activeRecordings) {
            if (recording.egressId) {
              try {
                await egressClient.stopEgress(recording.egressId);
                recording.status = 'processing';
                await recording.save();
                console.log(`Auto-stopped recording ${recording._id} for ended meeting ${meeting._id}`);
              } catch (err) {
                console.error(`Error stopping recording ${recording._id}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error auto-stopping recordings:', err);
      }
    }

    await meeting.save();
    await meeting.populate('hostId', 'name email');

    res.json({ meeting });
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete meeting
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only host can delete meeting
    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can delete meeting' });
    }

    await meeting.deleteOne();

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
