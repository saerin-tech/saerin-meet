# SaerinMeet - Video Conferencing Platform

A full-stack MERN application for Zoom-like video conferencing with recording capabilities using LiveKit infrastructure.

## Features

- 🎥 **Real-time Video Conferencing** with LiveKit
- 🎙️ **Audio/Video Controls** (Mute, Camera on/off)
- 🖥️ **Screen Sharing** capabilities
- 📹 **Meeting Recording** with LiveKit Egress API
- 👥 **Meeting Management** (Create, Schedule, Join, End)
- 🔐 **User Authentication** with JWT
- 📊 **Dashboard** for managing meetings
- 📼 **Recordings Library** with playback and download
- 📱 **Responsive Design** for mobile and desktop

## Technology Stack

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database
- **LiveKit Server SDK** - Video infrastructure
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **LiveKit React Components** - Video UI components
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Toastify** - Notifications

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn

### LiveKit Setup

You need to set up your own LiveKit infrastructure:

#### Option 1: LiveKit Cloud (Recommended for beginners)
1. Sign up at [LiveKit Cloud](https://cloud.livekit.io/)
2. Create a new project
3. Get your API Key, API Secret, and WebSocket URL

#### Option 2: Self-hosted LiveKit Server
1. Follow the [LiveKit deployment guide](https://docs.livekit.io/deploy/)
2. Deploy LiveKit server using Docker or Kubernetes
3. Generate API credentials

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd saerinmeet
```

### 2. Backend Setup

```bash
cd server
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env` file with your configurations:

```env
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/saerinmeet

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this

# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-server.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Recording Storage
RECORDINGS_PATH=./recordings
```

### 3. Frontend Setup

```bash
cd ../client
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# Using Homebrew on macOS
brew services start mongodb-community

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Running the Application

### Development Mode

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

### 1. Register/Login
- Navigate to http://localhost:3000
- Create a new account or login

### 2. Create a Meeting
- Click "Create New Meeting"
- Fill in meeting details
- Configure meeting settings
- Click "Create Meeting"

### 3. Join a Meeting
- From dashboard, click "Join Meeting" on any meeting
- Allow camera and microphone permissions
- You'll enter the video conference room

### 4. Recording
- As a host, click "Start Recording" in the meeting
- Recording will be saved to the server
- Click "Stop Recording" when done
- Access recordings from "Recordings" page

### 5. Meeting Controls
- **Mute/Unmute** - Control your microphone
- **Camera On/Off** - Control your video
- **Screen Share** - Share your screen
- **Leave Meeting** - Exit the conference

## Project Structure

```
saerinmeet/
├── server/
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Meeting.js
│   │   └── Recording.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── meetings.js
│   │   ├── recordings.js
│   │   └── users.js
│   ├── middleware/       # Express middleware
│   │   └── auth.js
│   ├── recordings/       # Stored recordings
│   ├── server.js         # Main server file
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Navbar.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/      # React context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/        # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateMeeting.jsx
│   │   │   ├── MeetingRoom.jsx
│   │   │   └── Recordings.jsx
│   │   ├── utils/        # Utility functions
│   │   │   └── api.js
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # Entry point
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Meetings
- `POST /api/meetings` - Create new meeting
- `GET /api/meetings` - Get all meetings
- `GET /api/meetings/:id` - Get meeting by ID
- `GET /api/meetings/room/:roomName` - Get meeting by room name
- `POST /api/meetings/:id/join` - Get token to join meeting
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Recordings
- `POST /api/recordings/start` - Start recording
- `POST /api/recordings/stop` - Stop recording
- `GET /api/recordings` - Get all recordings
- `GET /api/recordings/:id` - Get recording by ID
- `GET /api/recordings/meeting/:meetingId` - Get recordings for meeting
- `DELETE /api/recordings/:id` - Delete recording

## Deployment

### Backend Deployment (Heroku, Railway, or DigitalOcean)

1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible (use MongoDB Atlas for cloud)
3. Deploy the server folder

### Frontend Deployment (Vercel, Netlify)

1. Build the production version:
   ```bash
   cd client
   npm run build
   ```
2. Deploy the `dist` folder
3. Set environment variable: `VITE_API_URL`

### LiveKit Infrastructure

For production, consider:
- **LiveKit Cloud** - Managed solution
- **Self-hosted** - Docker/Kubernetes deployment
- Configure TURN servers for better connectivity

## Configuration Options

### Meeting Settings
- `muteOnEntry` - Mute participants when they join
- `allowScreenShare` - Enable screen sharing
- `allowChat` - Enable chat functionality
- `maxParticipants` - Maximum number of participants

### Recording Settings
- Recordings are saved to `server/recordings/` by default
- Configure `RECORDINGS_PATH` in .env for custom location
- Recordings use MP4 format by default

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB service
brew services start mongodb-community
```

### LiveKit Connection Issues
- Verify your LiveKit credentials in `.env`
- Check if LiveKit server is accessible
- Ensure WebSocket URL starts with `wss://`

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill

# Kill process on port 3000
lsof -ti:3000 | xargs kill
```

## Security Considerations

1. **JWT Secret** - Use a strong, random secret in production
2. **CORS** - Configure proper CORS origins
3. **HTTPS** - Use HTTPS in production
4. **Environment Variables** - Never commit `.env` files
5. **Input Validation** - All inputs are validated on backend
6. **Authentication** - All protected routes require JWT token

## Performance Optimization

1. **Video Quality** - Adjust video quality based on bandwidth
2. **Recording Size** - Compress recordings for storage efficiency
3. **Database Indexing** - Index frequently queried fields
4. **CDN** - Use CDN for static assets in production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Check the [LiveKit Documentation](https://docs.livekit.io/)
- Open an issue in this repository
- Contact support team

## Acknowledgments

- [LiveKit](https://livekit.io/) - For the amazing video infrastructure
- [MongoDB](https://www.mongodb.com/) - Database
- [React](https://react.dev/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework

---

Built with ❤️ using MERN Stack and LiveKit
