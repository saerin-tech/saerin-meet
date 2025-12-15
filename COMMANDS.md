# Common Commands - SaerinMeet

Quick reference for frequently used commands.

## Setup Commands

### Initial Setup
```bash
# Install all dependencies (server + client)
npm run install:all

# Or install separately
npm run install:server
npm run install:client

# Check if setup is correct
./check-setup.sh
```

### Environment Configuration
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit environment files (use nano, vim, or any editor)
nano server/.env
nano client/.env
```

## Development Commands

### Start Application
```bash
# Start both backend and frontend together
npm run dev

# Start backend only
npm run dev:server
# Access: http://localhost:5000

# Start frontend only
npm run dev:client
# Access: http://localhost:3000
```

### Database Commands
```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Stop MongoDB
brew services stop mongodb-community

# Restart MongoDB
brew services restart mongodb-community

# Connect to MongoDB
mongosh

# Or with connection string
mongosh "mongodb://localhost:27017/saerinmeet"

# Start MongoDB with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Stop Docker MongoDB
docker stop mongodb
```

### Port Management
```bash
# Check what's running on port 5000 (backend)
lsof -i :5000

# Kill process on port 5000
lsof -ti:5000 | xargs kill

# Check what's running on port 3000 (frontend)
lsof -i :3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Kill all node processes (use with caution)
pkill -9 node
```

## Testing Commands

### Backend Testing
```bash
# Test server health
curl http://localhost:5000/api/health

# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test with token
TOKEN="your_jwt_token"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/auth/me
```

### Database Queries
```javascript
// Connect to MongoDB shell
mongosh "mongodb://localhost:27017/saerinmeet"

// Show all users
db.users.find().pretty()

// Show all meetings
db.meetings.find().pretty()

// Show all recordings
db.recordings.find().pretty()

// Count documents
db.users.countDocuments()
db.meetings.countDocuments()

// Delete all test data (use with caution!)
db.users.deleteMany({})
db.meetings.deleteMany({})
db.recordings.deleteMany({})

// Find specific user
db.users.findOne({ email: "test@example.com" })

// Delete specific user
db.users.deleteOne({ email: "test@example.com" })
```

## Build Commands

### Production Build
```bash
# Build frontend for production
cd client
npm run build

# Preview production build
npm run preview

# Build output will be in client/dist/
```

## Git Commands

### Initial Commit
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SaerinMeet video conferencing app"

# Add remote repository
git remote add origin your-repo-url

# Push to remote
git push -u origin main
```

### Regular Workflow
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your commit message"

# Pull latest changes
git pull origin main

# Push changes
git push origin main

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
```

## Debugging Commands

### View Logs
```bash
# View backend logs (if using npm run dev:server)
# Logs appear directly in terminal

# View frontend logs
# Open browser console (F12) or check terminal

# View MongoDB logs (macOS)
tail -f /usr/local/var/log/mongodb/mongo.log

# View system logs (macOS)
log show --predicate 'process == "node"' --last 10m
```

### Clear Cache
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear browser cache
# Chrome: Cmd+Shift+Delete
# Firefox: Cmd+Shift+Delete
# Safari: Cmd+Option+E
```

## Maintenance Commands

### Update Dependencies
```bash
# Check for outdated packages
npm outdated

# Update all packages (server)
cd server
npm update

# Update all packages (client)
cd client
npm update

# Update specific package
npm update package-name

# Install latest version
npm install package-name@latest
```

### Security Audit
```bash
# Run security audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Fix with breaking changes
npm audit fix --force
```

## Docker Commands (if using Docker)

### MongoDB with Docker
```bash
# Start MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest

# Stop container
docker stop mongodb

# Start container
docker start mongodb

# Remove container
docker rm mongodb

# View logs
docker logs mongodb

# Execute commands in container
docker exec -it mongodb mongosh
```

### Application with Docker (advanced)
```bash
# Build server image
cd server
docker build -t saerinmeet-server .

# Build client image
cd client
docker build -t saerinmeet-client .

# Run with docker-compose
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

## Monitoring Commands

### System Resources
```bash
# Check CPU and memory usage
top

# Check disk space
df -h

# Check specific process
ps aux | grep node

# Monitor network connections
netstat -an | grep LISTEN
```

### Application Monitoring
```bash
# Count active connections to backend
lsof -i :5000 | wc -l

# Check MongoDB connections
mongosh --eval "db.serverStatus().connections"

# View real-time logs (if using PM2)
pm2 logs saerinmeet-api --lines 100
```

## Backup Commands

### Database Backup
```bash
# Backup entire database
mongodump --uri="mongodb://localhost:27017/saerinmeet" --out=/path/to/backup

# Backup specific collection
mongodump --uri="mongodb://localhost:27017/saerinmeet" --collection=users --out=/path/to/backup

# Restore database
mongorestore --uri="mongodb://localhost:27017/saerinmeet" /path/to/backup/saerinmeet

# Backup to compressed archive
mongodump --uri="mongodb://localhost:27017/saerinmeet" --archive=saerinmeet-backup.gz --gzip
```

### Code Backup
```bash
# Create backup branch
git branch backup-$(date +%Y%m%d)

# Create tarball
tar -czf saerinmeet-backup-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  .
```

## Performance Commands

### Analyze Bundle Size
```bash
# Analyze client bundle
cd client
npm run build
npx vite-bundle-analyzer dist/stats.html
```

### Check Response Times
```bash
# Using curl with timing
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health

# Create curl-format.txt:
cat > curl-format.txt << EOF
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

## Troubleshooting Commands

### Reset Everything
```bash
# Stop all services
pkill -9 node
brew services stop mongodb-community

# Clean everything
rm -rf server/node_modules
rm -rf client/node_modules
rm -rf node_modules
rm -rf server/package-lock.json
rm -rf client/package-lock.json

# Reinstall
npm run install:all

# Restart MongoDB
brew services start mongodb-community

# Start fresh
npm run dev
```

### Fix Common Issues
```bash
# Fix permissions
sudo chown -R $(whoami) ~/.npm

# Fix port conflicts
lsof -ti:5000 | xargs kill
lsof -ti:3000 | xargs kill

# Fix MongoDB issues
brew services restart mongodb-community

# Reset git
git reset --hard HEAD
git clean -fd
```

## Quick Commands Summary

```bash
# Setup
npm run install:all              # Install dependencies
./check-setup.sh                 # Check configuration

# Development
npm run dev                      # Start both servers
npm run dev:server              # Start backend only
npm run dev:client              # Start frontend only

# Database
brew services start mongodb-community    # Start MongoDB
mongosh                                 # Connect to MongoDB

# Testing
curl http://localhost:5000/api/health   # Test backend
open http://localhost:3000              # Open frontend

# Debugging
lsof -i :5000                   # Check backend port
lsof -i :3000                   # Check frontend port
npm cache clean --force         # Clear npm cache

# Build
cd client && npm run build      # Build for production

# Git
git add . && git commit -m "msg" && git push    # Quick commit

# Cleanup
pkill -9 node                   # Kill all node processes
rm -rf node_modules            # Remove dependencies
```

## Keyboard Shortcuts

### Terminal
- `Ctrl + C` - Stop running process
- `Ctrl + Z` - Suspend process
- `Ctrl + D` - Exit terminal/shell
- `Ctrl + L` - Clear terminal
- `↑` - Previous command
- `Tab` - Auto-complete

### Browser DevTools
- `F12` or `Cmd+Option+I` - Open DevTools
- `Cmd+Shift+C` - Inspect element
- `Cmd+Option+J` - Console
- `Cmd+R` - Reload page
- `Cmd+Shift+R` - Hard reload

---

**Pro Tip**: Save frequently used commands as shell aliases!

Add to `~/.zshrc` or `~/.bashrc`:
```bash
alias saerin-dev="cd ~/Projects/saerinmeet && npm run dev"
alias saerin-server="cd ~/Projects/saerinmeet && npm run dev:server"
alias saerin-client="cd ~/Projects/saerinmeet && npm run dev:client"
alias mongo-start="brew services start mongodb-community"
alias mongo-stop="brew services stop mongodb-community"
```

Then reload: `source ~/.zshrc`
