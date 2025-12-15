const express = require('express');
const router = express.Router();
const { EgressClient, EncodedFileType } = require('livekit-server-sdk');
const authMiddleware = require('../middleware/auth');
const Recording = require('../models/Recording');
const Meeting = require('../models/Meeting');
const path = require('path');
const fs = require('fs');
const { fileExists, getFileStats, deleteFile, getPresignedUrl } = require('../utils/minio');

// Initialize LiveKit Egress Client
const egressClient = new EgressClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

// Start recording
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { meetingId, roomName } = req.body;

    if (!meetingId || !roomName) {
      return res.status(400).json({ message: 'Meeting ID and room name are required' });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only host can start recording
    if (meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can start recording' });
    }

    // Check if already recording
    if (meeting.isRecording) {
      return res.status(400).json({ message: 'Meeting is already being recorded' });
    }

    // Create recording record
    const recording = new Recording({
      meetingId,
      title: meeting.title,
      roomName,
      status: 'recording',
      createdBy: req.user._id,
      startedAt: new Date()
    });

    const filename = `${roomName}-${Date.now()}.mp4`;

    console.log('Starting recording:');
    console.log('  - Room:', roomName);
    console.log('  - Filename:', filename);
    console.log('  - Storage: MinIO (S3) - using egress.yaml config');

    try {
      // Start LiveKit egress - S3 config comes from egress.yaml
      // Don't override it here, as the egress service uses the correct Docker service name
      const egressInfo = await egressClient.startRoomCompositeEgress(roomName, {
        file: {
          fileType: EncodedFileType.MP4,
          filepath: filename,
        },
        options: {
          preset: 'HD_30', // Use HD preset for better quality
        },
        layout: 'speaker', // Use speaker layout which handles empty rooms better
        audioOnly: false, // Record video when available
        videoOnly: false, // Record audio when available
      });

      recording.egressId = egressInfo.egressId;
      recording.filePath = filename; // Store just the filename for MinIO
      await recording.save();

      console.log('Recording started successfully:');
      console.log(egressInfo, "EGRESS INFO");
      console.log('  - Egress ID:', egressInfo.egressId);
      console.log('  - File will be saved to MinIO:', filename);

      meeting.isRecording = true;
      await meeting.save();

      res.json({
        message: 'Recording started',
        recording: {
          id: recording._id,
          egressId: egressInfo.egressId,
          status: recording.status
        }
      });
    } catch (egressError) {
      console.error('LiveKit egress error:', egressError);
      recording.status = 'failed';
      await recording.save();
      throw egressError;
    }
  } catch (error) {
    console.error('Start recording error:', error);
    res.status(500).json({ message: 'Failed to start recording', error: error.message });
  }
});

// Stop recording
router.post('/stop', authMiddleware, async (req, res) => {
  try {
    const { recordingId, egressId, meetingId } = req.body;

    if (!recordingId && !egressId) {
      return res.status(400).json({ message: 'Recording ID or Egress ID is required' });
    }

    const recording = recordingId 
      ? await Recording.findById(recordingId)
      : await Recording.findOne({ egressId });

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    const meeting = await Meeting.findById(recording.meetingId || meetingId);
    
    // Only host can stop recording
    if (meeting && meeting.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can stop recording' });
    }
    console.log('Stopping recording with Egress ID:', recording.egressId);
    
    // Stop LiveKit egress - let it handle all states gracefully
    let egressAborted = false;
    
    if (recording.egressId) {
      try {
        await egressClient.stopEgress(recording.egressId);
        console.log('Egress stopped successfully:', recording.egressId);
      } catch (stopError) {
        console.error('Error stopping egress:', stopError.message);
        
        // Check if egress was already in an aborted/terminal state
        // Status code 3 (INVALID_ARGUMENT) or 9 (FAILED_PRECONDITION) means already stopped/aborted
        if (stopError.code === 3 || stopError.code === 9 || 
            stopError.code === 'INVALID_ARGUMENT' || 
            stopError.code === 'FAILED_PRECONDITION' ||
            (stopError.message && (
              stopError.message.includes('EGRESS_ABORTED') || 
              stopError.message.includes('cannot be stopped') ||
              stopError.message.includes('already stopped')
            ))) {
          console.log('Egress already in terminal state - checking if it was aborted');
          egressAborted = true;
        } else {
          // For other errors, log but continue
          console.error('Unexpected error stopping egress, continuing anyway');
        }
      }
    }
    
    // If egress was aborted, mark recording as failed
    if (egressAborted) {
      recording.status = 'failed';
      recording.error = 'No active video/audio tracks to record. Make sure participants are in the room with cameras/microphones enabled.';
      recording.completedAt = new Date();
      await recording.save();
      
      if (meeting) {
        meeting.isRecording = false;
        await meeting.save();
      }
      
      return res.status(400).json({ 
        message: 'Recording failed - no active tracks',
        error: recording.error,
        recording: {
          id: recording._id,
          status: recording.status,
          error: recording.error
        }
      });
    }

    // Update recording status to processing
    recording.status = 'processing';
    recording.completedAt = new Date();
    await recording.save();

    if (meeting) {
      meeting.isRecording = false;
      await meeting.save();
    }

    // Start checking for the file in the background
    setTimeout(() => checkRecordingFile(recording._id), 5000);

    res.json({
      message: 'Recording stopped and processing',
      recording: {
        id: recording._id,
        status: recording.status,
        filePath: recording.filePath
      }
    });
  } catch (error) {
    console.error('Stop recording error:', error);
    res.status(500).json({ message: 'Failed to stop recording', error: error.message });
  }
});

// Helper function to check if recording file is ready in MinIO
async function checkRecordingFile(recordingId, attempts = 0) {
  const maxAttempts = 12; // Check for up to 60 seconds (12 * 5 seconds)
  
  try {
    const recording = await Recording.findById(recordingId);
    if (!recording || recording.status !== 'processing') {
      return;
    }

    console.log(`Checking recording file in MinIO (attempt ${attempts + 1}/${maxAttempts}):`, recording.filePath);

    // Check if file exists in MinIO
    const exists = await fileExists(recording.filePath);
    
    if (exists) {
      const stats = await getFileStats(recording.filePath);
      
      console.log(`File found in MinIO! Size: ${stats.size} bytes`);
      
      // Check if file has content (not empty)
      if (stats.size > 0) {
        recording.fileSize = stats.size;
        recording.status = 'completed';
        
        // Generate presigned URL for download (expires in 1 hour)
        const presignedUrl = await getPresignedUrl(recording.filePath, 3600);
        recording.fileUrl = `/api/recordings/download/${recording._id}`;
        
        await recording.save();
        console.log('✅ Recording completed:', recording.filePath);
        return;
      } else {
        console.log('File exists but is empty, waiting...');
      }
    } else {
      console.log('File not found in MinIO yet, will retry...');
    }

    // If not ready and haven't exceeded max attempts, check again
    if (attempts < maxAttempts) {
      setTimeout(() => checkRecordingFile(recordingId, attempts + 1), 5000);
    } else {
      // File not found after all attempts
      recording.status = 'failed';
      recording.error = 'Recording file not found in MinIO after processing';
      await recording.save();
      console.error('❌ Recording file not found after max attempts:', recording.filePath);
    }
  } catch (error) {
    console.error('Error checking recording file:', error);
  }
}

// Check recording status (for polling from frontend)
router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user has access
    if (recording.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If still processing, check if file is ready now in MinIO
    if (recording.status === 'processing') {
      const exists = await fileExists(recording.filePath);
      if (exists) {
        const stats = await getFileStats(recording.filePath);
        if (stats.size > 0) {
          recording.fileSize = stats.size;
          recording.status = 'completed';
          recording.fileUrl = `/api/recordings/download/${recording._id}`;
          await recording.save();
        }
      }
    }

    res.json({
      status: recording.status,
      fileSize: recording.fileSize,
      fileUrl: recording.fileUrl,
      completedAt: recording.completedAt
    });
  } catch (error) {
    console.error('Check recording status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all recordings
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { createdBy: req.user._id };
    if (status) {
      query.status = status;
    }

    const recordings = await Recording.find(query)
      .populate('meetingId', 'title roomName')
      .populate('createdBy', 'name email')
      .sort({ startedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Recording.countDocuments(query);

    res.json({
      recordings,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recording by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id)
      .populate('meetingId', 'title roomName')
      .populate('createdBy', 'name email');

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user has access to this recording
    if (recording.createdBy._id.toString() !== req.user._id.toString()) {
      const meeting = await Meeting.findById(recording.meetingId);
      const isParticipant = meeting && meeting.participants.some(
        p => p.userId && p.userId.toString() === req.user._id.toString()
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ recording });
  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recordings for a meeting
router.get('/meeting/:meetingId', authMiddleware, async (req, res) => {
  try {
    const recordings = await Recording.find({ meetingId: req.params.meetingId })
      .populate('createdBy', 'name email')
      .sort({ startedAt: -1 });

    res.json({ recordings });
  } catch (error) {
    console.error('Get meeting recordings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download recording
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user has access
    if (recording.createdBy.toString() !== req.user._id.toString()) {
      const meeting = await Meeting.findById(recording.meetingId);
      const isParticipant = meeting && meeting.participants.some(
        p => p.userId && p.userId.toString() === req.user._id.toString()
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check if file exists in MinIO
    const exists = await fileExists(recording.filePath);
    if (!exists) {
      return res.status(404).json({ message: 'Recording file not found' });
    }

    // Generate and redirect to presigned URL (valid for 1 hour)
    const presignedUrl = await getPresignedUrl(recording.filePath, 3600);
    res.redirect(presignedUrl);
  } catch (error) {
    console.error('Download recording error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Watch recording - generates a presigned URL for streaming
router.get('/watch/:id', authMiddleware, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user has access
    if (recording.createdBy.toString() !== req.user._id.toString()) {
      const meeting = await Meeting.findById(recording.meetingId);
      const isParticipant = meeting && meeting.participants.some(
        p => p.userId && p.userId.toString() === req.user._id.toString()
      );
      
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Check if file exists in MinIO
    const exists = await fileExists(recording.filePath);
    if (!exists) {
      return res.status(404).json({ message: 'Recording file not found' });
    }

    // Generate presigned URL (valid for 2 hours for watching)
    const presignedUrl = await getPresignedUrl(recording.filePath, 7200);
    
    // Return JSON with the URL so frontend can use it
    res.json({ url: presignedUrl });
  } catch (error) {
    console.error('Watch recording error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete recording
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Only creator can delete recording
    if (recording.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only creator can delete recording' });
    }

    // Delete file from MinIO if exists
    if (recording.filePath) {
      try {
        await deleteFile(recording.filePath);
        console.log('Deleted recording from MinIO:', recording.filePath);
      } catch (error) {
        console.error('Error deleting from MinIO:', error);
      }
    }

    await recording.deleteOne();

    res.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Webhook endpoint for LiveKit egress updates
router.post('/webhook', async (req, res) => {
  try {
    const { event, egressInfo } = req.body;

    if (event === 'egress_ended' || event === 'egress_updated') {
      const recording = await Recording.findOne({ egressId: egressInfo.egressId });
      
      if (recording) {
        if (egressInfo.status === 'EGRESS_COMPLETE') {
          recording.status = 'completed';
          recording.fileUrl = `/api/recordings/download/${recording._id}`;
          recording.duration = egressInfo.duration || 0;
          
          // Get file size from MinIO
          if (recording.filePath) {
            try {
              const stats = await getFileStats(recording.filePath);
              recording.fileSize = stats.size;
            } catch (error) {
              console.error('Error getting file stats from MinIO:', error);
            }
          }
        } else if (egressInfo.status === 'EGRESS_FAILED') {
          recording.status = 'failed';
        }
        
        await recording.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

module.exports = router;
