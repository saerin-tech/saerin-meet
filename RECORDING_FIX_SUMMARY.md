# Recording System Fix Summary

## Problem
Recordings were stuck in "processing" status indefinitely after stopping, and files were not being found.

## Root Causes Identified

### 1. **Path Mismatch Issue**
- Backend was using relative paths like `./recordings/file.mp4`
- Egress container expected paths relative to `/out` 
- Backend then checked using relative path which resolved differently

### 2. **Volume Mount Issue**
- Egress was using a Docker volume (`egress-data`) instead of bind mount
- Files were saved inside container volume, not accessible to backend
- Backend and egress couldn't see the same files

### 3. **File Check Timing Issue**
- Backend checked for file immediately after stopping egress
- Egress needs time to finalize and save the file
- No retry mechanism if file wasn't ready yet

## Fixes Applied

### 1. **Path Resolution** (`server/routes/recordings.js`)
```javascript
// Use absolute path for backend
const recordingsDir = path.resolve(process.env.RECORDINGS_PATH || './recordings');
const fullPath = path.join(recordingsDir, filename);

// Use filename only for egress (relative to /out mount)
const egressPath = filename;

// Egress saves to: /out/filename.mp4
// Backend checks: /Users/ahmed/.../server/recordings/filename.mp4
// Both point to same file via bind mount
```

### 2. **Docker Volume Mount** (`livekit/docker-compose.yml`)
**Before:**
```yaml
volumes:
  - egress-data:/out  # Docker volume
```

**After:**
```yaml
volumes:
  - ${PWD}/../server/recordings:/out  # Bind mount to host directory
```

### 3. **Background File Checking** (`server/routes/recordings.js`)
```javascript
// Check every 5 seconds, up to 60 seconds total
async function checkRecordingFile(recordingId, attempts = 0) {
  const maxAttempts = 12;
  
  // Check if file exists and has content
  if (fs.existsSync(recording.filePath)) {
    const stats = fs.statSync(recording.filePath);
    if (stats.size > 0) {
      // File is ready!
      recording.status = 'completed';
      recording.fileSize = stats.size;
      recording.fileUrl = `/api/recordings/download/${recording._id}`;
      await recording.save();
      return;
    }
  }
  
  // Retry if not found yet
  if (attempts < maxAttempts) {
    setTimeout(() => checkRecordingFile(recordingId, attempts + 1), 5000);
  } else {
    recording.status = 'failed';
    await recording.save();
  }
}
```

### 4. **Frontend Polling** (`client/src/pages/Recordings.jsx`)
```javascript
// Poll status endpoint every 5 seconds for processing recordings
const startPolling = (recordingId) => {
  const interval = setInterval(async () => {
    const response = await api.get(`/recordings/${recordingId}/status`);
    const { status, fileSize, fileUrl } = response.data;
    
    // Update UI
    setRecordings(prev => prev.map(rec => 
      rec._id === recordingId ? { ...rec, status, fileSize, fileUrl } : rec
    ));
    
    // Stop polling when done
    if (status === 'completed' || status === 'failed') {
      clearInterval(interval);
      toast.success('Recording is ready!');
    }
  }, 5000);
};
```

### 5. **Configuration Updates**

**`server/.env`:**
```bash
# Changed from relative to absolute path
RECORDINGS_PATH=/Users/ahmed/Projects/saerinmeet/server/recordings
```

**`server/server.js`:**
```javascript
// Resolve to absolute path and log it
const recordingsPath = path.resolve(process.env.RECORDINGS_PATH || './recordings');
console.log('📁 Recordings directory:', recordingsPath);
```

### 6. **Enhanced Logging**
Added detailed logging throughout the recording process:
- When recording starts: room name, egress path, full path
- When egress stops: egress ID
- During file checks: attempt number, file existence, file size
- When completed: final file path and size
- On failure: reason and path checked

### 7. **Status API Endpoint** (`server/routes/recordings.js`)
```javascript
// GET /api/recordings/:id/status
// Allows frontend to poll for status updates
router.get('/:id/status', authMiddleware, async (req, res) => {
  const recording = await Recording.findById(req.params.id);
  
  // If still processing, check if file is ready now
  if (recording.status === 'processing' && 
      recording.filePath && 
      fs.existsSync(recording.filePath)) {
    const stats = fs.statSync(recording.filePath);
    if (stats.size > 0) {
      recording.status = 'completed';
      recording.fileSize = stats.size;
      recording.fileUrl = `/api/recordings/download/${recording._id}`;
      await recording.save();
    }
  }
  
  res.json({
    status: recording.status,
    fileSize: recording.fileSize,
    fileUrl: recording.fileUrl
  });
});
```

## How It Works Now

### Recording Flow:

1. **Start Recording** (POST `/api/recordings/start`)
   - Generate filename: `room-name-timestamp.mp4`
   - Create egress with path: `filename.mp4` (relative to /out)
   - Save to DB with path: `/full/path/to/recordings/filename.mp4`
   - Status: `recording`

2. **Stop Recording** (POST `/api/recordings/stop`)
   - Call `egressClient.stopEgress(egressId)`
   - Set status to `processing`
   - Start background file check (runs every 5s)
   - Frontend starts polling status endpoint

3. **File Processing** (Background)
   - Egress finalizes video file
   - Saves to: `/out/filename.mp4` (inside container)
   - Maps to: `/Users/.../server/recordings/filename.mp4` (on host)
   - Backend can now see the file

4. **File Detection**
   - Background checker finds file exists and size > 0
   - Updates status to `completed`
   - Sets fileSize and fileUrl
   - Frontend receives update via polling
   - Shows toast: "Recording is ready!"

5. **Download** (GET `/api/recordings/download/:id`)
   - File is accessible via static serving
   - URL: `/api/recordings/download/:id`
   - Streams file to user

## Testing Checklist

- [x] Docker containers running (livekit, egress, redis)
- [x] Volume mount correctly configured (bind mount to recordings dir)
- [x] Recordings directory exists and has correct permissions
- [x] .env has absolute path for RECORDINGS_PATH
- [ ] Start backend server (`npm run dev:server`)
- [ ] Create a meeting and join
- [ ] Start recording
- [ ] Stop recording
- [ ] Verify status changes: `recording` → `processing` → `completed`
- [ ] Verify file appears in `/server/recordings/` directory
- [ ] Verify file is downloadable from UI

## Files Modified

1. `server/routes/recordings.js` - Path handling, background checking, status endpoint, logging
2. `server/server.js` - Absolute path resolution, logging
3. `server/.env` - Absolute path for RECORDINGS_PATH
4. `client/src/pages/Recordings.jsx` - Polling mechanism, UI updates
5. `client/src/pages/Recordings.css` - Processing spinner animation
6. `livekit/docker-compose.yml` - Bind mount instead of volume
7. `verify-recording-setup.sh` - Verification script (new)

## Verification Commands

```bash
# Check Docker mounts
docker inspect livekit-egress-1 --format '{{json .Mounts}}' | python3 -m json.tool

# Check egress logs
docker compose -f livekit/docker-compose.yml logs egress | tail -20

# Check recordings directory
ls -lh /Users/ahmed/Projects/saerinmeet/server/recordings/

# Watch backend logs for recording info
npm run dev:server
```

## Expected Output

When recording works correctly, you should see:

**Backend logs:**
```
Starting recording:
  - Room: room-1234567890-abc
  - Egress path (container): room-1234567890-abc-1234567890.mp4
  - Full path (host): /Users/ahmed/.../server/recordings/room-1234567890-abc-1234567890.mp4
  - Recordings dir: /Users/ahmed/.../server/recordings

Recording started successfully:
  - Egress ID: EG_XYZ123
  - File will be saved to: /Users/ahmed/.../server/recordings/room-1234567890-abc-1234567890.mp4

Egress stopped successfully: EG_XYZ123

Checking recording file (attempt 1/12): /Users/ahmed/.../server/recordings/room-1234567890-abc-1234567890.mp4
File not found yet, will retry...

Checking recording file (attempt 2/12): /Users/ahmed/.../server/recordings/room-1234567890-abc-1234567890.mp4
File found! Size: 1234567 bytes
✅ Recording completed: /Users/ahmed/.../server/recordings/room-1234567890-abc-1234567890.mp4
```

**Frontend:**
- Shows "processing" badge with spinning icon
- Yellow box: "⏳ Processing recording... This may take a few moments."
- After 5-30 seconds: Status changes to "completed"
- Toast notification: "Recording is ready!"
- Download and Watch buttons appear
