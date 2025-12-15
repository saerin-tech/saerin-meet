# MinIO Integration Guide for SaerinMeet

This guide explains how SaerinMeet uses MinIO for scalable, S3-compatible recording storage.

## Overview

MinIO is an open-source, S3-compatible object storage system. We use it to store meeting recordings instead of local file storage, providing:

- **Scalability**: Handle large numbers of recordings without local disk space concerns
- **Reliability**: Built-in data durability and integrity
- **S3 Compatibility**: Can easily migrate to AWS S3, Google Cloud Storage, or other S3-compatible services
- **Web Console**: Visual interface for managing recordings
- **API Access**: Programmatic access to recordings via presigned URLs

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────┐
│   LiveKit   │─────▶│    MinIO     │◀─────│ Backend │
│   Egress    │      │   (S3 API)   │      │ Server  │
└─────────────┘      └──────────────┘      └─────────┘
     │                      │                     │
     │                      │                     │
     └──── Writes MP4 ──────┘                     │
                             │                    │
                             └── Generates URLs ──┘
                                   for download
```

## Components

### 1. Docker Services

**docker-compose.yml** includes:
- **LiveKit Server**: Video conferencing server
- **LiveKit Egress**: Recording service that writes to MinIO
- **MinIO**: Object storage server
- **Redis**: Coordination between LiveKit components

### 2. Backend Integration

**server/utils/minio.js**: MinIO client utilities
- Bucket initialization
- File existence checking
- Presigned URL generation
- File deletion

**server/routes/recordings.js**: Updated to use MinIO
- Start recording → Egress writes to MinIO
- Stop recording → Check MinIO for file
- Download → Generate presigned URL
- Delete → Remove from MinIO

### 3. Configuration

**livekit/egress.yaml**: S3 configuration
```yaml
s3:
  access_key: ${MINIO_ACCESS_KEY}
  secret: ${MINIO_SECRET_KEY}
  region: us-east-1
  endpoint: http://minio:9000
  bucket: recordings
```

**server/.env**: MinIO connection settings
```properties
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=recordings
```

## Setup Instructions

### 1. Start MinIO Service

```bash
cd livekit
docker compose up -d minio
```

Wait for MinIO to be ready (check logs):
```bash
docker compose logs -f minio
```

### 2. Initialize MinIO Bucket

Option A: Using the setup script (recommended)
```bash
cd /Users/ahmed/Projects/saerinmeet
./setup-minio.sh setup
```

Option B: The application will auto-create the bucket on first start

### 3. Verify MinIO is Running

```bash
./setup-minio.sh check
```

Or access the web console:
- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

### 4. Start All Services

```bash
cd livekit
docker compose up -d
```

### 5. Start Backend Server

```bash
cd server
npm run dev
```

The backend will connect to MinIO on startup and initialize the bucket if needed.

## Usage

### Recording Flow with MinIO

1. **Start Recording**
   - User clicks "Start Recording" in meeting
   - Backend calls LiveKit Egress API
   - Egress starts recording and writes to MinIO (s3://recordings/filename.mp4)
   - Recording status: "recording"

2. **Stop Recording**
   - User clicks "Stop Recording"
   - Backend calls Egress stop API
   - Egress finalizes file and uploads to MinIO
   - Recording status: "processing"
   - Backend polls MinIO every 5 seconds

3. **File Ready**
   - Backend detects file in MinIO
   - Recording status: "completed"
   - Frontend updates UI automatically

4. **Download Recording**
   - User clicks download button
   - Backend generates presigned URL (valid 1 hour)
   - User downloads directly from MinIO

### Presigned URLs

Instead of streaming through the backend, we generate presigned URLs that allow direct download from MinIO:

```javascript
const presignedUrl = await getPresignedUrl(filename, 3600); // 1 hour expiry
res.redirect(presignedUrl);
```

Benefits:
- Reduces backend load
- Faster downloads
- Secure (time-limited, signed URLs)

## Management

### Using the Setup Script

```bash
# Check MinIO status
./setup-minio.sh check

# List all recordings
./setup-minio.sh list

# Show access info
./setup-minio.sh info
```

### Using MinIO Web Console

1. Open http://localhost:9001
2. Login with minioadmin/minioadmin
3. Navigate to "Buckets" → "recordings"
4. View, download, or delete recordings visually

### Using MinIO Client (mc)

Install mc (MinIO Client):
```bash
brew install minio/stable/mc
```

Configure alias:
```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
```

Common commands:
```bash
# List recordings
mc ls local/recordings

# Download a recording
mc cp local/recordings/room-123-1234567890.mp4 ~/Downloads/

# Delete a recording
mc rm local/recordings/room-123-1234567890.mp4

# Get file info
mc stat local/recordings/room-123-1234567890.mp4
```

## Monitoring

### Check Bucket Status

```bash
docker exec -it saerinmeet-minio mc admin info local
```

### View Logs

```bash
docker compose logs -f minio
```

### Disk Usage

```bash
docker exec -it saerinmeet-minio du -sh /data
```

## Migration from Local Storage

If you were using local file storage before:

1. **Backup existing recordings**
   ```bash
   cp -r server/recordings server/recordings-backup
   ```

2. **Upload to MinIO** (optional - to preserve old recordings)
   ```bash
   mc cp --recursive server/recordings/ local/recordings/
   ```

3. **Update database** (if needed - filePath should just be filename)
   ```javascript
   // Update Recording documents to store just filename instead of full path
   db.recordings.updateMany(
     {},
     [{
       $set: {
         filePath: {
           $arrayElemAt: [
             { $split: ["$filePath", "/"] },
             -1
           ]
         }
       }
     }]
   )
   ```

## Production Considerations

### Security

1. **Change default credentials**:
   ```bash
   # In livekit/.env
   MINIO_ACCESS_KEY=your-secure-access-key
   MINIO_SECRET_KEY=your-secure-secret-key-min-40-chars
   ```

2. **Enable HTTPS**:
   - Use a reverse proxy (nginx, traefik)
   - Get SSL certificate (Let's Encrypt)
   - Update MINIO_USE_SSL=true

3. **Network security**:
   - Don't expose MinIO ports publicly
   - Use internal Docker networks
   - Access via backend only

### Performance

1. **Adjust CPU limits** in egress.yaml:
   ```yaml
   cpu_cost:
     room_composite_cpu_cost: 3.0
   ```

2. **Monitor disk space**:
   - Set up alerts for disk usage
   - Implement retention policies

3. **Use SSD storage** for better I/O performance

### Scaling

#### Option 1: Distributed MinIO
Run multiple MinIO instances for high availability:
```bash
docker compose up -d --scale minio=4
```

#### Option 2: Migrate to Cloud S3
Switch to AWS S3, Google Cloud Storage, or DigitalOcean Spaces:

1. Update egress.yaml:
   ```yaml
   s3:
     access_key: ${AWS_ACCESS_KEY_ID}
     secret: ${AWS_SECRET_ACCESS_KEY}
     region: us-east-1
     # Remove endpoint for AWS S3
     bucket: your-production-bucket
   ```

2. Update server/.env:
   ```properties
   MINIO_ENDPOINT=s3.amazonaws.com
   MINIO_PORT=443
   MINIO_USE_SSL=true
   MINIO_ACCESS_KEY=your-aws-access-key
   MINIO_SECRET_KEY=your-aws-secret-key
   MINIO_BUCKET=your-production-bucket
   ```

The code remains the same - it's S3-compatible!

## Troubleshooting

### Egress can't connect to MinIO

**Symptom**: Recording fails, logs show connection error

**Solution**:
1. Check MinIO is running: `docker compose ps minio`
2. Check network: `docker compose exec egress ping minio`
3. Verify credentials in egress.yaml match livekit/.env

### File not found in MinIO

**Symptom**: Recording status stuck on "processing"

**Solution**:
1. Check egress logs: `docker compose logs egress`
2. Verify bucket exists: `./setup-minio.sh check`
3. Check MinIO logs: `docker compose logs minio`

### Permission denied errors

**Symptom**: Can't write to MinIO

**Solution**:
1. Verify access key/secret are correct
2. Check bucket policy: `mc anonymous list local/recordings`
3. Recreate bucket: `mc rb --force local/recordings && mc mb local/recordings`

### Downloads fail

**Symptom**: 404 or expired URL error

**Solution**:
1. Presigned URLs expire after 1 hour by default
2. Check file exists: `mc ls local/recordings/`
3. Verify MinIO is accessible from backend

## API Reference

### MinIO Utility Functions

```javascript
const { 
  initializeBucket,    // Create bucket if not exists
  fileExists,          // Check if file exists
  getFileStats,        // Get file size and metadata
  deleteFile,          // Delete file from bucket
  getPresignedUrl,     // Generate download URL
  getFileStream        // Stream file (alternative to presigned URL)
} = require('./utils/minio');

// Example: Check if recording exists
const exists = await fileExists('room-123-1234567890.mp4');

// Example: Get file info
const stats = await getFileStats('room-123-1234567890.mp4');
console.log('Size:', stats.size, 'bytes');

// Example: Generate download URL (valid 2 hours)
const url = await getPresignedUrl('room-123-1234567890.mp4', 7200);
```

## Benefits Summary

✅ **Scalability**: No local disk space limits
✅ **Reliability**: Built-in redundancy and integrity
✅ **Performance**: Direct downloads from object storage
✅ **Cost-effective**: Open-source, S3-compatible
✅ **Cloud-ready**: Easy migration to AWS S3/GCS
✅ **Developer-friendly**: Web console and CLI tools
✅ **Production-ready**: Used by major companies

## Next Steps

1. **Set up monitoring**: Add health checks and alerts
2. **Implement retention policy**: Auto-delete old recordings
3. **Add thumbnails**: Generate preview images in MinIO
4. **Enable encryption**: Server-side encryption for recordings
5. **Set up backup**: Regular backups of MinIO data
6. **Configure CDN**: Use CloudFront/CloudFlare for global distribution

## Resources

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO Client Guide](https://min.io/docs/minio/linux/reference/minio-mc.html)
- [LiveKit Egress S3 Upload](https://docs.livekit.io/egress/overview/#s3-upload)
- [S3 API Compatibility](https://min.io/product/s3-compatibility)
