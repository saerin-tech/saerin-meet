# Quick Start Guide - SaerinMeet

Get SaerinMeet up and running in minutes!

## Prerequisites Check

```bash
# Check Node.js (need v16+)
node --version

# Check npm
npm --version

# Check MongoDB (need v5+)
mongosh --version
```

## 5-Minute Setup

### 1. Install Dependencies

```bash
# Install both client and server dependencies
npm run install:all
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Use in `.env` file

### 3. Setup LiveKit

**Quick Option: LiveKit Cloud**
1. Sign up at [LiveKit Cloud](https://cloud.livekit.io/)
2. Create a project
3. Copy credentials (API Key, Secret, URL)

### 4. Configure Environment

**Server (.env):**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saerinmeet
JWT_SECRET=my_super_secret_jwt_key_123456
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
FRONTEND_URL=http://localhost:3000
```

**Client (.env):**
```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Start Application

**Option A: Run Both Together**
```bash
# From root directory
npm run dev
```

**Option B: Run Separately**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 6. Access Application

Open your browser:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## First Steps

### 1. Create Account
1. Go to http://localhost:3000
2. Click "Register"
3. Fill in your details
4. Submit

### 2. Create First Meeting
1. Click "Create New Meeting"
2. Enter meeting title
3. Click "Create Meeting"

### 3. Join Meeting
1. Click "Join Meeting" 
2. Allow camera/microphone permissions
3. You're in!

## Common Issues & Fixes

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill

# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# If not, start it
brew services start mongodb-community
```

### LiveKit Connection Failed
- Verify credentials in `.env`
- Check LiveKit URL format: `wss://...`
- Test credentials in LiveKit dashboard

### Can't See Video
- Check browser permissions
- Allow camera/microphone access
- Check TURN server configuration
- Try different browser

## Testing the Setup

### 1. Backend Health Check
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "OK",
  "message": "SaerinMeet server is running",
  "livekit": {
    "configured": true
  }
}
```

### 2. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test in Browser
1. Open http://localhost:3000
2. Open browser console (F12)
3. Check for errors
4. Should see no errors if setup correctly

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- **Backend**: Nodemon watches for file changes
- **Frontend**: Vite HMR updates instantly

### Debugging
```bash
# View backend logs
cd server
npm run dev

# View detailed logs
NODE_ENV=development npm run dev
```

### Database GUI
Use MongoDB Compass to view data:
```bash
# Connection string
mongodb://localhost:27017/saerinmeet
```

## Sample Data

Create test meetings via the UI or API:

```bash
# Login first to get token
TOKEN="your_jwt_token_here"

# Create meeting
curl -X POST http://localhost:5000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Meeting",
    "description": "Testing the API",
    "duration": 60
  }'
```

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random string
- [ ] Setup MongoDB Atlas or managed database
- [ ] Use production LiveKit server
- [ ] Enable SSL/HTTPS
- [ ] Configure CORS properly
- [ ] Set up environment variables on hosting platform
- [ ] Enable TURN server for better connectivity
- [ ] Set up monitoring and logging
- [ ] Configure backup for recordings
- [ ] Test with multiple users
- [ ] Perform security audit

## Next Steps

1. **Read Full Documentation**: See [README.md](./README.md)
2. **Setup LiveKit**: See [LIVEKIT_SETUP.md](./LIVEKIT_SETUP.md)
3. **Customize UI**: Edit components in `client/src/`
4. **Add Features**: Extend API in `server/routes/`
5. **Deploy**: Follow deployment guides

## Useful Commands

```bash
# Install dependencies
npm run install:all

# Run in development
npm run dev

# Run server only
npm run dev:server

# Run client only
npm run dev:client

# Build for production
npm run build:client

# View logs
cd server && npm run dev
cd client && npm run dev
```

## Getting Help

- **Documentation**: Check README.md and LIVEKIT_SETUP.md
- **LiveKit Docs**: https://docs.livekit.io/
- **Issues**: Open an issue on GitHub
- **Community**: Join LiveKit Discord

## Video Tutorial

For a video walkthrough, check out:
1. Setting up MongoDB
2. Configuring LiveKit
3. Running the application
4. Creating your first meeting

---

**Estimated Setup Time**: 5-10 minutes

Ready to start? Run: `npm run install:all && npm run dev`
