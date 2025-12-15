# Recording Requirements and Troubleshooting

## Prerequisites for Recording

For a recording to work properly, the following conditions must be met:

### ✅ Required Conditions:

1. **Active Participants**: At least one person must be in the meeting room
2. **Active Tracks**: At least one participant must have their camera OR microphone enabled and publishing
3. **Room Activity**: The egress service waits for active video/audio streams before starting to record

### ⚠️ Common Issues:

#### Issue: "Recording failed - no active tracks"

**Cause:** The egress service detected no active video or audio streams in the room.

**Solutions:**
- Make sure at least one participant has joined the meeting
- Ensure at least one participant has enabled their camera or microphone
- Check that participants have granted browser permissions for camera/microphone
- Wait a few seconds after participants join before starting the recording

#### Issue: "EGRESS_ABORTED" error in logs

**Cause:** Egress waited for active tracks but none were detected within the timeout period.

**What happens:**
- Egress waits ~20 seconds for an active track
- If no tracks are detected, it aborts with "Start signal not received"
- Recording is marked as "failed"
- No file is created

**Solutions:**
- Have participants join BEFORE starting the recording
- Make sure participants enable their cameras/mics BEFORE recording starts
- Test audio/video is working before hitting "Start Recording"

## Recording Workflow

### Correct Workflow:

1. **Create Meeting** → Meeting room is created
2. **Join Meeting** → Participants join the room
3. **Enable Devices** → Participants turn on cameras/microphones
4. **Verify Tracks** → See video/audio working in the UI
5. **Start Recording** → Host clicks "Start Recording"
6. **Record Content** → Meeting proceeds normally
7. **Stop Recording** → Host clicks "Stop Recording"
8. **Processing** → Wait 5-60 seconds for file to be ready
9. **Download** → Recording available in "Recordings" page

### Recording States:

- **pending**: Recording created but not started
- **recording**: ⚫ Live recording in progress
- **processing**: ⏳ File being finalized (5-60 seconds)
- **completed**: ✅ Ready to download
- **failed**: ❌ Recording did not complete (see error message)

## Testing Recording Locally

### Single User Test:
```bash
# 1. Start all services
cd livekit && docker compose up -d
npm run dev:server
npm run dev:client

# 2. Open browser at localhost:3000
# 3. Create meeting and join
# 4. Enable YOUR camera/microphone
# 5. Start recording
# 6. Talk/move for a few seconds
# 7. Stop recording
# 8. Check Recordings page - should show "processing" then "completed"
```

### Multi-User Test:
```bash
# Option 1: Multiple tabs
- Open meeting in Tab 1 (as host)
- Copy meeting room URL
- Open same URL in Tab 2 (incognito)
- Both enable cameras
- Host starts recording in Tab 1

# Option 2: Multiple devices
- Open meeting on Computer 1 (as host)
- Open meeting on Phone/Computer 2
- Both enable cameras
- Host starts recording
```

## Debugging Recording Issues

### Check Egress Logs:
```bash
cd livekit
docker compose logs egress | tail -50

# Look for:
# - "request received" - Recording request received
# - "START_RECORDING" - Egress detected active tracks
# - "END_RECORDING" - Recording stopped normally
# - "EGRESS_ABORTED" - No active tracks detected (problem!)
```

### Check Backend Logs:
```bash
npm run dev:server

# Look for:
# - "Starting recording: Room: ..." - Recording initiated
# - "Recording started successfully: Egress ID: ..." - Success
# - "Checking recording file (attempt X/12)" - Processing
# - "File found! Size: X bytes" - File ready
# - "Recording completed: ..." - Success
# - "Recording file not found after max attempts" - Problem
```

### Check Recordings Directory:
```bash
ls -lh /Users/ahmed/Projects/saerinmeet/server/recordings/

# Should see .mp4 files after recording stops
# If empty, recording didn't work
```

### Check Browser Console:
```javascript
// Open DevTools → Console
// Look for:
// - Errors about permissions
// - Errors about tracks
// - WebRTC connection errors
```

## Error Messages Explained

### Backend Errors:

| Error | Meaning | Solution |
|-------|---------|----------|
| "No active video/audio tracks to record" | Egress aborted, no tracks found | Ensure participants have enabled devices |
| "Recording file not found after max attempts" | File wasn't created | Check egress logs, may be config issue |
| "Failed to start recording" | General error | Check backend logs for details |
| "Only host can start recording" | Non-host tried to start | Use host account |

### Frontend Messages:

| Message | Meaning | Action |
|---------|---------|--------|
| ⏳ Processing recording... | Waiting for file | Wait 5-60 seconds |
| ✅ Recording is ready! | File available | Can download now |
| ❌ Recording failed - no active tracks | Egress aborted | Start over with devices enabled |
| ❌ Recording processing failed | File not found | Check backend logs |

## Best Practices

### For Hosts:
1. ✅ Have at least one participant join before starting recording
2. ✅ Verify you can see/hear participants before recording
3. ✅ Wait 2-3 seconds after joining before starting recording
4. ✅ Let recording run for at least 10 seconds to ensure content
5. ✅ Check "Recordings" page after stopping to verify processing

### For Development:
1. ✅ Always enable your own camera/mic when testing solo
2. ✅ Check egress logs to see what happened
3. ✅ Monitor backend logs during recording
4. ✅ Verify recordings directory has files
5. ✅ Test with multiple participants when possible

## Advanced Configuration

### Egress Timeout Settings:

The egress service has a timeout for detecting tracks. If you need to adjust it, modify `egress.yaml`:

```yaml
# Not currently exposed, but available in advanced config
# Default: ~20 seconds to detect first track
```

### File Location:

Recordings are saved to:
- **Container**: `/out/filename.mp4`
- **Host**: `/Users/ahmed/Projects/saerinmeet/server/recordings/filename.mp4`
- **URL**: `http://localhost:5000/api/recordings/download/:id`

### Storage Considerations:

- MP4 files are ~100-500MB per hour depending on quality
- Disk space required: Estimate 200MB per hour of recording
- Cleanup old recordings periodically

## Quick Reference

### Start Recording Button Tooltip:
"Make sure at least one participant has their camera or microphone enabled"

### When Recording Fails:
1. Check if anyone was in the room
2. Check if any devices were enabled
3. Look at error message in Recordings page
4. Check egress logs: `docker compose logs egress`
5. Try again with devices enabled

### Recording Times:
- **Start delay**: 1-2 seconds (egress setup)
- **Stop delay**: 2-5 seconds (egress stop)
- **Processing time**: 5-60 seconds (video finalization)
- **Total overhead**: ~10-70 seconds per recording
