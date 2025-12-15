# 🎥 SaerinMeet - Self-Hosted Video Conferencing Platform

A full-featured, self-hosted video conferencing platform built with the MERN stack and on-premises LiveKit infrastructure. Features real-time video/audio communication, screen sharing, chat, and cloud recording capabilities with complete control over your data.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.2.0-blue)
![LiveKit](https://img.shields.io/badge/LiveKit-2.0.5-orange)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green)

---

## 📑 Table of Contents

- [Features](#-features)
- [Technology Stack](#️-technology-stack)
- [Architecture](#️-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [LiveKit Setup](#-livekit-setup)
- [MinIO Storage Setup](#-minio-storage-setup)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Docker Services](#-docker-services)
- [Common Commands](#-common-commands)
- [Deployment](#-deployment)
- [Security Best Practices](#-security-best-practices)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎬 Video Conferencing

- **Real-time Video & Audio** - HD video calls with adaptive bitrate streaming
- **Screen Sharing** - Share your screen with participants
- **Camera & Microphone Controls** - Toggle video/audio on the fly
- **Grid & Speaker View** - Dynamic layout switching based on active speakers
- **Multi-participant Support** - Host meetings with multiple participants

### 💬 Communication

- **Real-time Chat** - Send messages during meetings
- **Participant List** - See who's in the meeting with live status updates
- **Audio Indicators** - Visual feedback when participants speak
- **Connection Quality** - Monitor network status in real-time

### 🎙️ Recording & Storage

- **Cloud Recording** - Record meetings to MinIO (S3-compatible storage)
- **Automatic Processing** - Background processing with status updates
- **Download & Stream** - Download recordings or watch directly in browser
- **Auto-stop on Meeting End** - Recordings automatically stop when host ends meeting
- **Presigned URLs** - Secure, time-limited access to recordings

### 👥 Meeting Management

- **Create Meetings** - Schedule or start instant meetings
- **Join via Link** - Share meeting links for easy access
- **Copy Meeting Link** - One-click link sharing
- **Host Controls** - Only hosts can start/stop recordings and end meetings
- **Meeting Dashboard** - View all your meetings and their status

### �� Authentication & Security

- **JWT Authentication** - Secure user sessions
- **Protected Routes** - Authentication required for meeting access
- **LiveKit Tokens** - Secure room access with expiring tokens
- **Self-Hosted** - Complete control over your data and privacy

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| Vite | 7.2.7 | Build tool and dev server |
| LiveKit React Components | 2.0.5 | Video conferencing UI |
| React Router | 6.20.1 | Client-side routing |
| Axios | 1.6.2 | HTTP client |
| React Toastify | 9.1.3 | Notifications |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 16+ | Runtime environment |
| Express | 4.18.2 | Server framework |
| MongoDB | 8.0 | Database |
| Mongoose | 8.0.3 | MongoDB ODM |
| LiveKit Server SDK | 2.0.5 | Real-time communication |
| MinIO Client | 8.0.6 | S3-compatible storage |
| JWT | 9.0.2 | Authentication tokens |
| bcryptjs | 2.4.3 | Password hashing |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| LiveKit Server | WebRTC SFU (Selective Forwarding Unit) |
| LiveKit Egress | Recording service |
| MinIO | S3-compatible object storage |
| Redis | Coordination layer for LiveKit |
| Docker & Docker Compose | Containerization |

---

## 🏗️ Architecture


```
┌─────────────────────────────────────────────────────────────────-┐
│                     CLIENT (React + Vite)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   ┌──────────┐   │
│  │   Login/   │  │ Dashboard  │  │  Meeting   │   │Recording │   │
│  │  Register  │  │   & List   │  │    Room    │   │  Library │   │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   └────┬─────┘   │
│        └───────────────┴───────────────┴───────────────┘         │
│                              │                                   │
│                         API Client                               │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP/REST
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js/Express)                      │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                      API Routes                           │   │
│  │  ┌────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐   │   │
│  │  │  Auth  │  │ Meetings │  │ Recordings │  │  Users   │   │   │
│  │  └────────┘  └──────────┘  └────────────┘  └──────────┘   │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐   │
│  │              Middleware (Auth, Validation)                │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────┬───────────────────────────────────┬───────────────-┘
              │                                   │
    ┌─────────▼─────────┐               ┌─────────▼─────────┐
    │     MongoDB       │               │   LiveKit Stack   │
    │     Database      │               │  ┌─────────────┐  │
    └───────────────────┘               │  │   LiveKit   │  │
                                        │  │   Server    │  │
                                        │  └──────┬──────┘  │
                                        │         │         │
                                        │  ┌──────▼──────┐  │
                                        │  │   Egress    │  │
                                        │  │   Service   │  │
                                        │  └──────┬──────┘  │
                                        │         │         │
                                        │  ┌──────▼──────┐  │
                                        │  │    MinIO    │  │
                                        │  │     S3      │  │
                                        │  └─────────────┘  │
                                        │         │         │
                                        │  ┌──────▼──────┐  │
                                        │  │    Redis    │  │
                                        │  └─────────────┘  │
                                        └───────────────────┘
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | >= 16.0.0 | `node --version` |
| npm | >= 8.0.0 | `npm --version` |
| MongoDB | >= 5.0 | `mongosh --version` |
| Docker | Latest | `docker --version` |
| Docker Compose | Latest | `docker compose version` |

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/saerin-tech/saerin-meet.git
cd saerinmeet

# 2. Install all dependencies
npm run install:all

# 3. Setup environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 4. Start MongoDB (if local)
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# 5. Start LiveKit infrastructure
cd livekit
docker compose up -d
cd ..

# 6. Initialize MinIO bucket
./setup-minio.sh setup

# 7. Start the application
npm run dev

# 8. Access the application
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
# MinIO:    http://localhost:9001
```

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/saerin-tech/saerin-meet.git
cd saerinmeet
```

### 2. Install Dependencies

```bash
# Install all dependencies (client + server)
npm run install:all

# Or install separately
npm run install:server
npm run install:client
```

### 3. Configure Environment Variables

#### Server Configuration (`server/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/saerinmeet

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-server.com


# Frontend URL
FRONTEND_URL=http://localhost:5173

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=recordings
```

#### Client Configuration (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start Infrastructure Services

```bash
# Navigate to livekit directory
cd livekit

# Start all services (LiveKit, Egress, MinIO, Redis)
docker compose up -d

# Verify services are running
docker compose ps

# Check logs
docker compose logs -f
```

**Services will be available at:**

| Service | URL | Credentials |
|---------|-----|-------------|
| LiveKit Server | `ws://localhost:7880` | API Key/Secret |
| MinIO Console | `http://localhost:9001` | minioadmin / minioadmin |
| MinIO API | `http://localhost:9000` | — |
| Redis | `localhost:6379` | — |

### 5. Start the Application

```bash
# From root directory

# Option A: Run both together
npm run dev

# Option B: Run separately
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

**Access the application:**

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 🔧 LiveKit Setup

### Option 1: LiveKit Cloud (Easiest)

1. **Create Account**
   - Go to [https://cloud.livekit.io/](https://cloud.livekit.io/)
   - Sign up for a free account
   - Verify your email

2. **Create a Project**
   - Click "Create Project"
   - Give your project a name (e.g., "SaerinMeet")
   - Select a region closest to your users

3. **Get Credentials**
   - Go to "Settings" → "API Keys"
   - Click "Create Key"
   - Copy: API Key, API Secret, WebSocket URL

4. **Configure SaerinMeet**

   ```env
   # server/.env
   LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
   LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

### Option 2: Self-Hosted (On-Premises)

#### Docker Compose Configuration

The project includes pre-configured Docker setup in `livekit/docker-compose.yml`:

```yaml
version: '3.9'

services:
  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    restart: unless-stopped
    network_mode: bridge
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882/udp"
      - "50000-50100:50000-50100/udp"
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml

  egress:
    image: livekit/egress:latest
    restart: unless-stopped
    environment:
      - EGRESS_CONFIG_FILE=/etc/egress.yaml
    volumes:
      - ./egress.yaml:/etc/egress.yaml
    cap_add:
      - SYS_ADMIN

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --bind 0.0.0.0 --protected-mode no

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio-data:/data

volumes:
  minio-data:
```

#### LiveKit Server Configuration (`livekit/livekit.yaml`)

```yaml
port: 7880
bind_addresses:
  - "0.0.0.0"

rtc:
  port_range_start: 50000
  port_range_end: 50100
  use_external_ip: false
  tcp_port: 7881
  udp_port: 7882

redis:
  address: redis:6379

keys:
  livekit-api-key: livekit-api-secret

room:
  auto_create: true
  empty_timeout: 300
  max_participants: 100

logging:
  level: info
```

#### Egress Configuration (`livekit/egress.yaml`)

```yaml
api_key: livekit-api-key
api_secret: livekit-api-secret
ws_url: ws://livekit:7880
insecure: true

health_port: 9090
log_level: debug

redis:
  address: redis:6379

storage:
  s3:
    access_key: minioadmin
    secret: minioadmin
    endpoint: http://minio:9000
    bucket: recordings
    force_path_style: true
```


---

## 📦 MinIO Storage Setup

MinIO provides S3-compatible object storage for meeting recordings.

### Quick Setup

```bash
# Start MinIO service
cd livekit
docker compose up -d minio

# Initialize bucket using setup script
cd ..
chmod +x setup-minio.sh
./setup-minio.sh setup
```

### Manual Setup

1. **Access MinIO Console**
   - URL: http://localhost:9001
   - Username: `minioadmin`
   - Password: `minioadmin`

2. **Create Bucket**
   - Navigate to "Buckets"
   - Click "Create Bucket"
   - Name: `recordings`
   - Click "Create"

### Verify Setup

```bash
# Check MinIO status
./setup-minio.sh check

# List recordings
./setup-minio.sh list

# Show access info
./setup-minio.sh info
```

---

## 📖 Usage Guide

### Creating a Meeting

1. **Register/Login** to your account
2. Click **"Create New Meeting"** on the Dashboard
3. Enter meeting **title** and optional **description**
4. Click **"Create"**
5. You'll be redirected to the meeting room
6. Enable camera/microphone when prompted
7. Share the meeting link with participants

### Joining a Meeting

**Method 1: Direct Link**

- Click the meeting link shared by the host
- Login if prompted
- Join automatically

**Method 2: Join Meeting Page**

1. Click **"Join Meeting"** button on Dashboard
2. Paste the meeting link or enter room name
3. Click **"Join Meeting"**

**Method 3: From Dashboard**

- Find the meeting in your list
- Click **"Join"** button

### Recording a Meeting

> **Note:** Only the meeting host can start/stop recordings.

1. Join a meeting as the **host**
2. Ensure your camera or microphone is **active**
3. Click **"🔴 Start Recording"**
4. Wait for confirmation (~30 seconds for initialization)
5. The button changes to **"⏹️ Stop Recording"** when active
6. Click **"⏹️ Stop Recording"** when done
7. Recording processes in background
8. View/Download from the **Recordings** page

**Auto-Stop Feature:** Recordings automatically stop when the host ends the meeting.

### Viewing Recordings

1. Navigate to **"Recordings"** page from navbar
2. See all your recordings with status indicators:
   - 🔴 **Recording** — Currently recording
   - ⏳ **Processing** — Being processed (auto-refreshes)
   - ✅ **Completed** — Ready to watch/download
   - ❌ **Failed** — Recording failed
3. Click **"Watch"** to stream in browser
4. Click **"Download"** to save the MP4 file

---

## 📁 Project Structure

```
saerinmeet/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.jsx      # Navigation bar
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/            # React context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateMeeting.jsx
│   │   │   ├── JoinMeeting.jsx
│   │   │   ├── MeetingRoom.jsx
│   │   │   └── Recordings.jsx
│   │   ├── utils/
│   │   │   └── api.js          # Axios instance
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Express Backend
│   ├── models/                  # MongoDB models
│   │   ├── User.js
│   │   ├── Meeting.js
│   │   └── Recording.js
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── meetings.js
│   │   └── recordings.js
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── utils/
│   │   └── minio.js             # MinIO client
│   ├── recordings/              # Local fallback storage
│   ├── server.js
│   └── package.json
│
├── livekit/                     # LiveKit Infrastructure
│   ├── docker-compose.yml
│   ├── livekit.yaml             # LiveKit server config
│   ├── egress.yaml              # Egress service config
│   └── .env
│
├── setup-minio.sh               # MinIO setup script
├── check-setup.sh               # Environment check script
├── package.json                 # Root package.json
└── README.md                    # This file
```

---

## 📡 API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/me` | GET | Get current user |

### Meetings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meetings` | GET | Get all user's meetings |
| `/api/meetings` | POST | Create new meeting |
| `/api/meetings/:id` | GET | Get meeting by ID |
| `/api/meetings/:id` | PUT | Update meeting |
| `/api/meetings/:id` | DELETE | Delete meeting |
| `/api/meetings/:id/join` | POST | Join meeting (get token) |
| `/api/meetings/room/:roomName` | GET | Get meeting by room name |

### Recordings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recordings` | GET | Get all recordings |
| `/api/recordings/start` | POST | Start recording |
| `/api/recordings/stop` | POST | Stop recording |
| `/api/recordings/:id/status` | GET | Get recording status |
| `/api/recordings/download/:id` | GET | Download recording |
| `/api/recordings/watch/:id` | GET | Get streaming URL |

---

## 🐳 Docker Services

### Managing Docker Services

```bash
cd livekit

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f egress

# Stop all services
docker compose down

# Restart a specific service
docker compose restart egress

# Remove all data (⚠️ deletes recordings!)
docker compose down -v
```

### Service Health Checks

```bash
# Check service status
docker compose ps

# Check LiveKit server
curl http://localhost:7880

# Check MinIO health
curl http://localhost:9000/minio/health/live

# Check Redis
docker compose exec redis redis-cli ping
```

---

## 💻 Common Commands

### Development

```bash
# Start development (both client and server)
npm run dev

# Start backend only
npm run dev:server

# Start frontend only
npm run dev:client

# Build for production
npm run build:client
```

### Database

```bash
# Start MongoDB
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Stop MongoDB
# macOS
brew services stop mongodb-community

# Linux
sudo systemctl stop mongod

# Windows
net stop MongoDB

# Connect to MongoDB
mongosh "mongodb://localhost:27017/saerinmeet"

# MongoDB with Docker (all platforms)
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Port Management

```bash
# Check what's running on port 5000 (backend)
# macOS/Linux
lsof -i :5000

# Windows (PowerShell)
netstat -ano | findstr :5000

# Kill process on port 5000
# macOS/Linux
lsof -ti:5000 | xargs kill

# Windows (PowerShell - replace <PID> with actual PID from netstat)
taskkill /PID <PID> /F

# Check port 5173 (frontend)
# macOS/Linux
lsof -i :5173

# Windows (PowerShell)
netstat -ano | findstr :5173

# Kill all node processes
# macOS/Linux
pkill -9 node

# Windows (PowerShell)
taskkill /IM node.exe /F
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Change all default credentials
- [ ] Generate secure JWT_SECRET
- [ ] Configure SSL/HTTPS
- [ ] Set up MongoDB with authentication
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set `NODE_ENV=production`

### Environment Variables (Production)

```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For LIVEKIT_API_SECRET
```

```env
# Production settings
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/saerinmeet
LIVEKIT_URL=wss://your-domain.com
```

---

## 🔒 Security Best Practices

### 1. Change Default Credentials

```bash
# Generate secure secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # LIVEKIT_API_SECRET
```

### 2. Enable HTTPS

- Use SSL certificates (Let's Encrypt recommended)
- Configure reverse proxy (nginx/caddy)
- Update `LIVEKIT_URL` to use `wss://`

### 3. Secure MinIO

- Change default access key and secret
- Enable SSL/TLS
- Configure bucket policies

### 4. Environment Variables

- Never commit `.env` files
- Use secrets management (Vault, AWS Secrets Manager)
- Set `NODE_ENV=production`

### 5. Database Security

- Use authentication for MongoDB
- Enable SSL for MongoDB connections
- Regular backups

---

## 🔧 Troubleshooting

### Common Issues

#### "Start signal not received" (Egress)

```yaml
# Fix: Use Docker service names in egress.yaml
ws_url: ws://livekit:7880  # Not localhost

# Ensure use_external_ip is false in livekit.yaml
rtc:
  use_external_ip: false
```

#### "No authentication token" Error

- Ensure token is in Authorization header
- Or pass token as query parameter: `?token=...`

#### Recording not uploading

```yaml
# Check egress.yaml has correct storage structure
storage:
  s3:
    access_key: minioadmin
    # ... NOT at root level
```

#### Cannot connect to meeting

```bash
# Check all Docker services are running
docker compose ps

# Restart services
docker compose restart
```

### Logs

```bash
# Backend logs
cd server && npm run dev

# Frontend logs
cd client && npm run dev

# Docker service logs
docker compose logs -f livekit
docker compose logs -f egress
docker compose logs -f minio
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [LiveKit](https://livekit.io/) — Real-time communication infrastructure
- [MinIO](https://min.io/) — S3-compatible object storage
- [MongoDB](https://www.mongodb.com/) — Database
- [React](https://reactjs.org/) — Frontend framework

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/saerin-tech">Saerin Tech</a>
</p>
