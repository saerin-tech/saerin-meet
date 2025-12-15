# System Architecture - SaerinMeet

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │   Login/   │  │ Dashboard  │  │  Meeting   │               │
│  │  Register  │  │   & List   │  │    Room    │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│         │              │                 │                      │
│         └──────────────┴─────────────────┘                      │
│                       │                                         │
│                  Auth Context                                   │
│                       │                                         │
│                   API Client                                    │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                   HTTP/REST
                        │
┌───────────────────────┼─────────────────────────────────────────┐
│                       │     SERVER (Node.js/Express)            │
│                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Routes                           │   │
│  │  ┌─────────┐ ┌──────────┐ ┌─────────────┐ ┌─────────┐ │   │
│  │  │  Auth   │ │ Meetings │ │ Recordings  │ │  Users  │ │   │
│  │  └─────────┘ └──────────┘ └─────────────┘ └─────────┘ │   │
│  └────────┬────────────┬───────────┬─────────────┬────────┘   │
│           │            │           │             │            │
│  ┌────────▼────────────▼───────────▼─────────────▼────────┐   │
│  │              Middleware (Auth, Validation)             │   │
│  └─────────────────────┬──────────────────────────────────┘   │
│                        │                                       │
│  ┌─────────────────────▼──────────────────────────────────┐   │
│  │                 MongoDB Models                         │   │
│  │  ┌──────┐  ┌──────────┐  ┌────────────┐              │   │
│  │  │ User │  │ Meeting  │  │ Recording  │              │   │
│  │  └──────┘  └──────────┘  └────────────┘              │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                        │                    │
                        │                    │
                  ┌─────▼─────┐       ┌─────▼──────┐
                  │  MongoDB  │       │  LiveKit   │
                  │  Database │       │   Server   │
                  └───────────┘       └────────────┘
```

## Component Interaction Flow

### 1. User Registration/Login Flow
```
User Input → Frontend Form → API Client → /api/auth/register or /login
                                              ↓
                                         Validate Input
                                              ↓
                                         Hash Password
                                              ↓
                                         Save to MongoDB
                                              ↓
                                         Generate JWT Token
                                              ↓
                                    Return Token + User Data
                                              ↓
                                    Store Token in LocalStorage
                                              ↓
                                         Redirect to Dashboard
```

### 2. Creating a Meeting Flow
```
User Creates Meeting → Frontend Form → API Client → /api/meetings
                                                         ↓
                                                   Verify JWT Token
                                                         ↓
                                                   Validate Input
                                                         ↓
                                                   Generate Room Name
                                                         ↓
                                                   Save to MongoDB
                                                         ↓
                                                   Return Meeting Data
                                                         ↓
                                                   Update Dashboard
```

### 3. Joining a Meeting Flow
```
User Clicks Join → Frontend → API Client → /api/meetings/:id/join
                                                  ↓
                                            Verify JWT Token
                                                  ↓
                                            Check Meeting Status
                                                  ↓
                                            Generate LiveKit Token
                                                  ↓
                                      Return Token + LiveKit URL
                                                  ↓
                                    Connect to LiveKit Server
                                                  ↓
                              Establish WebRTC Connection
                                                  ↓
                                         Join Video Room
                                                  ↓
                                      Add to Participants List
```

### 4. Recording Flow
```
Host Starts Recording → API Call → /api/recordings/start
                                          ↓
                                    Verify Host Permission
                                          ↓
                                    Create Recording Document
                                          ↓
                              Start LiveKit Egress (Recording)
                                          ↓
                                    Update Meeting Status
                                          ↓
                           Return Recording ID & Status
                                          ↓
                              Display Recording Indicator
                                          ↓
                    Recording Process Running on LiveKit
                                          ↓
                              Save to Server Storage
                                          ↓
                     Webhook Updates Recording Status
                                          ↓
                        Recording Available for Playback
```

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String,
  role: String (user/admin),
  createdAt: Date
}
```

### Meeting Model
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  roomName: String (unique),
  hostId: ObjectId (ref: User),
  scheduledTime: Date,
  duration: Number,
  status: String (scheduled/active/ended/cancelled),
  isRecording: Boolean,
  participants: [{
    userId: ObjectId (ref: User),
    name: String,
    email: String,
    joinedAt: Date,
    leftAt: Date,
    duration: Number
  }],
  settings: {
    allowScreenShare: Boolean,
    allowChat: Boolean,
    muteOnEntry: Boolean,
    requireApproval: Boolean,
    maxParticipants: Number
  },
  createdAt: Date,
  startedAt: Date,
  endedAt: Date
}
```

### Recording Model
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId (ref: Meeting),
  title: String,
  roomName: String,
  egressId: String (LiveKit egress ID),
  filePath: String,
  fileUrl: String,
  fileSize: Number,
  duration: Number,
  status: String (pending/recording/processing/completed/failed),
  startedAt: Date,
  completedAt: Date,
  createdBy: ObjectId (ref: User),
  metadata: Mixed
}
```

## API Endpoints Structure

```
/api
├── /auth
│   ├── POST   /register          # Register new user
│   ├── POST   /login             # Login user
│   └── GET    /me                # Get current user (protected)
│
├── /meetings
│   ├── POST   /                  # Create meeting (protected)
│   ├── GET    /                  # List meetings (protected)
│   ├── GET    /:id               # Get meeting details (protected)
│   ├── GET    /room/:roomName    # Get by room name (protected)
│   ├── POST   /:id/join          # Join meeting - get token (protected)
│   ├── PUT    /:id               # Update meeting (protected)
│   └── DELETE /:id               # Delete meeting (protected)
│
├── /recordings
│   ├── POST   /start             # Start recording (protected)
│   ├── POST   /stop              # Stop recording (protected)
│   ├── GET    /                  # List recordings (protected)
│   ├── GET    /:id               # Get recording details (protected)
│   ├── GET    /meeting/:meetingId # Get meeting recordings (protected)
│   ├── DELETE /:id               # Delete recording (protected)
│   └── POST   /webhook           # LiveKit webhook (public)
│
└── /users
    ├── GET    /:id               # Get user profile (protected)
    ├── PUT    /profile           # Update profile (protected)
    └── GET    /search            # Search users (protected)
```

## Technology Stack Details

### Frontend Technologies
```
React 18.2.0
├── react-router-dom (6.20.1)      # Routing
├── axios (1.6.2)                  # HTTP client
├── react-toastify (9.1.3)         # Notifications
├── date-fns (3.0.6)               # Date formatting
├── @livekit/components-react      # LiveKit UI components
├── livekit-client                 # LiveKit WebRTC client
└── vite (5.0.8)                   # Build tool
```

### Backend Technologies
```
Node.js + Express
├── mongoose (8.0.3)               # MongoDB ODM
├── jsonwebtoken (9.0.2)           # JWT authentication
├── bcryptjs (2.4.3)               # Password hashing
├── livekit-server-sdk (2.0.5)     # LiveKit server SDK
├── express-validator (7.0.1)      # Input validation
├── cors (2.8.5)                   # CORS middleware
├── dotenv (16.3.1)                # Environment variables
├── multer (1.4.5)                 # File uploads
└── axios (1.6.2)                  # HTTP client
```

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. Server validates input
3. Password hashed with bcrypt (10 salt rounds)
4. JWT token generated (7 day expiry)
5. Token signed with secret key
6. Token returned to client
7. Client stores in localStorage
8. Client sends token in Authorization header
9. Server middleware verifies token
10. Request processed if valid
```

### Authorization Layers
```
┌─────────────────────────────────┐
│  Route Level Protection         │
│  (authMiddleware checks JWT)    │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│  Resource Level Authorization   │
│  (Check user owns resource)     │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│  Action Level Permission        │
│  (Host can record, end meeting) │
└─────────────────────────────────┘
```

## Scalability Considerations

### Current Architecture (Single Server)
- Handles: 50-100 concurrent users
- Meetings: 10-20 simultaneous
- Storage: Local filesystem

### Scaled Architecture (Future)
```
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
   ────┴────
   │       │
┌──▼──┐ ┌──▼──┐
│ API │ │ API │  ← Multiple backend instances
│  #1 │ │  #2 │
└──┬──┘ └──┬──┘
   └───┬───┘
       │
┌──────▼────────┐
│ MongoDB Cluster│
└───────────────┘

┌──────────────┐
│ LiveKit Nodes│  ← Regional deployment
│ (Multi-region)│
└──────────────┘

┌──────────────┐
│ Object Storage│  ← S3/GCS for recordings
│    (CDN)     │
└──────────────┘
```

## Performance Metrics

### Target Performance
- API Response Time: < 200ms
- Page Load Time: < 2s
- Video Latency: < 200ms
- Recording Lag: < 1s
- Database Query: < 50ms

### Monitoring Points
```
Frontend → API Server → Database
   │           │            │
   ▼           ▼            ▼
Response   Endpoint    Query Time
 Time       Time
```

## Deployment Architecture

### Development
```
Local Machine
├── Backend (localhost:5000)
├── Frontend (localhost:3000)
├── MongoDB (localhost:27017)
└── LiveKit (cloud or local)
```

### Production
```
Frontend (Vercel/Netlify)
    ↓ HTTPS
Backend (Railway/Heroku/DigitalOcean)
    ↓ HTTPS
MongoDB Atlas (Cloud)

LiveKit Cloud (Multi-region)
    ↓ WSS
Recording Storage (S3/GCS)
```

---

This architecture provides:
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Maintainability
- ✅ Real-time capabilities
- ✅ Cloud-ready deployment
