# Deployment Guide - SaerinMeet

Complete guide for deploying SaerinMeet to production.

## Table of Contents
1. [Pre-deployment Checklist](#pre-deployment-checklist)
2. [MongoDB Setup](#mongodb-setup)
3. [LiveKit Infrastructure](#livekit-infrastructure)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-deployment](#post-deployment)

## Pre-deployment Checklist

- [ ] MongoDB database ready (Atlas or self-hosted)
- [ ] LiveKit server configured (Cloud or self-hosted)
- [ ] Domain names ready (optional but recommended)
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] Environment variables prepared
- [ ] Code tested locally
- [ ] Git repository set up

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free/paid cluster
   - Select region closest to your users

2. **Configure Network Access**
   - Add IP addresses: `0.0.0.0/0` (or specific IPs)
   - Or use VPC peering for better security

3. **Create Database User**
   - Username: `saerinmeet_user`
   - Password: Generate strong password
   - Role: `readWrite` on database

4. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/saerinmeet?retryWrites=true&w=majority
   ```

### Option 2: Self-Hosted MongoDB

**Using Docker:**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=yourpassword \
  -v mongodb_data:/data/db \
  mongo:latest
```

**Connection String:**
```
mongodb://admin:yourpassword@your-server-ip:27017/saerinmeet?authSource=admin
```

## LiveKit Infrastructure

See [LIVEKIT_SETUP.md](./LIVEKIT_SETUP.md) for detailed instructions.

**Quick Setup with LiveKit Cloud:**
1. Sign up at [LiveKit Cloud](https://cloud.livekit.io/)
2. Create project
3. Note down: API Key, API Secret, WebSocket URL

## Backend Deployment

### Option 1: Railway (Easiest)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy**
   ```bash
   cd server
   railway init
   railway up
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set PORT=5000
   railway variables set MONGODB_URI="your_mongodb_connection"
   railway variables set JWT_SECRET="your_jwt_secret"
   railway variables set LIVEKIT_API_KEY="your_key"
   railway variables set LIVEKIT_API_SECRET="your_secret"
   railway variables set LIVEKIT_URL="wss://your-livekit.cloud"
   railway variables set FRONTEND_URL="https://your-frontend.com"
   ```

### Option 2: Heroku

1. **Install Heroku CLI**
   ```bash
   brew install heroku/brew/heroku
   heroku login
   ```

2. **Create App**
   ```bash
   cd server
   heroku create saerinmeet-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set PORT=5000
   heroku config:set MONGODB_URI="your_mongodb_connection"
   heroku config:set JWT_SECRET="your_jwt_secret"
   heroku config:set LIVEKIT_API_KEY="your_key"
   heroku config:set LIVEKIT_API_SECRET="your_secret"
   heroku config:set LIVEKIT_URL="wss://your-livekit.cloud"
   heroku config:set FRONTEND_URL="https://your-frontend.com"
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform

1. **Connect GitHub Repository**
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Connect GitHub repository

2. **Configure App**
   - Select `server` folder as source
   - Build command: `npm install`
   - Run command: `npm start`

3. **Environment Variables**
   Add all environment variables in the console

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Option 4: VPS (Ubuntu Server)

1. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Deploy Code**
   ```bash
   # Clone repository
   git clone your-repo-url
   cd saerinmeet/server
   
   # Install dependencies
   npm install --production
   
   # Create .env file
   nano .env
   # Add all environment variables
   
   # Start with PM2
   pm2 start server.js --name saerinmeet-api
   pm2 save
   pm2 startup
   ```

3. **Setup Nginx**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Setup SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   cd client
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Select your project
   - Settings → Environment Variables
   - Add: `VITE_API_URL=https://your-api.com/api`

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Build Locally**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy with Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=dist
   ```

3. **Environment Variables**
   - Netlify Dashboard → Site settings
   - Build & deploy → Environment
   - Add: `VITE_API_URL=https://your-api.com/api`

### Option 3: Nginx (VPS)

1. **Build Application**
   ```bash
   cd client
   npm run build
   ```

2. **Copy to Server**
   ```bash
   scp -r dist/* user@server:/var/www/saerinmeet
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /var/www/saerinmeet;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Setup SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## Environment Variables Summary

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/saerinmeet

# JWT
JWT_SECRET=very_long_random_string_minimum_32_characters

# LiveKit
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_URL=wss://your-project.livekit.cloud

# Frontend
FRONTEND_URL=https://yourdomain.com

# Storage
RECORDINGS_PATH=/app/recordings
```

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Post-deployment

### 1. Test Deployment

**Backend Health Check:**
```bash
curl https://api.yourdomain.com/api/health
```

**Frontend Check:**
- Visit https://yourdomain.com
- Register new user
- Create meeting
- Join meeting
- Test recording

### 2. Setup Monitoring

**Backend Monitoring with PM2:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Application Monitoring:**
- Set up [UptimeRobot](https://uptimerobot.com/) for uptime monitoring
- Configure error tracking with [Sentry](https://sentry.io/)
- Setup analytics with [Google Analytics](https://analytics.google.com/)

### 3. Configure Backups

**MongoDB Backups:**
```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mongodump --uri="your_mongodb_uri" --out=/backups/mongodb-$DATE
# Delete backups older than 7 days
find /backups -type d -mtime +7 -exec rm -rf {} +
```

**Recordings Backup:**
- Use cloud storage (AWS S3, Google Cloud Storage)
- Configure automatic sync
- Set lifecycle policies

### 4. Security Hardening

**Backend:**
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Add helmet middleware
- [ ] Enable HTTPS only
- [ ] Use secure cookies
- [ ] Regular security updates

**Database:**
- [ ] Restrict network access
- [ ] Use strong passwords
- [ ] Enable authentication
- [ ] Regular backups
- [ ] Monitor access logs

**Infrastructure:**
- [ ] Configure firewall
- [ ] Disable unnecessary ports
- [ ] Keep system updated
- [ ] Use SSH keys
- [ ] Enable fail2ban

### 5. Performance Optimization

**Backend:**
```javascript
// Add to server.js
const compression = require('compression');
app.use(compression());

// Enable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=31557600');
  next();
});
```

**Frontend:**
- Enable CDN for static assets
- Optimize images
- Enable gzip compression
- Lazy load components

**Database:**
- Create indexes on frequently queried fields
- Enable connection pooling
- Monitor slow queries

### 6. Scaling Considerations

**When to Scale:**
- CPU usage consistently > 70%
- Response time > 2 seconds
- More than 100 concurrent meetings
- Recording processing delays

**Scaling Strategies:**
- **Horizontal**: Add more server instances
- **Vertical**: Upgrade server resources
- **Database**: Use read replicas
- **LiveKit**: Deploy multiple regions
- **Storage**: Use CDN for recordings

### 7. Monitoring Dashboard

Set up monitoring for:
- Server uptime
- API response times
- Database connections
- Active meetings
- Recording storage
- Error rates
- User registrations

**Tools:**
- Grafana + Prometheus
- DataDog
- New Relic
- CloudWatch (AWS)

## Cost Estimates

### Small Deployment (10-50 users)
- **MongoDB Atlas**: Free tier
- **LiveKit Cloud**: $0-99/month
- **Railway/Heroku**: $7-25/month
- **Vercel**: Free tier
- **Total**: ~$7-125/month

### Medium Deployment (50-200 users)
- **MongoDB Atlas**: $57/month
- **LiveKit**: $99-299/month
- **DigitalOcean Droplet**: $40-80/month
- **CDN**: $20-50/month
- **Total**: ~$216-486/month

### Large Deployment (500+ users)
- **MongoDB Atlas**: $200+/month
- **LiveKit**: Custom pricing
- **Multiple servers**: $300+/month
- **Storage & CDN**: $100+/month
- **Total**: $600+/month

## Troubleshooting

### Deployment Issues

**Build Fails:**
- Check Node.js version
- Clear npm cache: `npm cache clean --force`
- Remove node_modules and reinstall

**Environment Variables Not Working:**
- Restart application
- Check variable names (case-sensitive)
- Verify .env file location

**Database Connection Fails:**
- Check IP whitelist
- Verify connection string
- Test with MongoDB Compass

### Runtime Issues

**High Memory Usage:**
- Implement memory limits
- Monitor for memory leaks
- Use PM2 cluster mode

**Slow Performance:**
- Check database queries
- Enable caching
- Optimize images
- Use CDN

**Recording Issues:**
- Verify disk space
- Check LiveKit egress configuration
- Monitor encoding performance

## Rollback Strategy

If deployment fails:

1. **Revert Code:**
   ```bash
   git revert HEAD
   git push heroku main
   ```

2. **Restore Database:**
   ```bash
   mongorestore --uri="connection_string" /path/to/backup
   ```

3. **Switch DNS:**
   - Point domain back to previous deployment
   - Update in DNS settings (TTL may cause delay)

## Support

For deployment help:
- Check logs first
- Review error messages
- Search documentation
- Ask in community forums
- Contact hosting support

---

**Deployment Checklist:**
- [ ] MongoDB configured
- [ ] LiveKit setup complete
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Environment variables set
- [ ] SSL certificates active
- [ ] DNS configured
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Security hardened
- [ ] Performance optimized
- [ ] Testing completed

Good luck with your deployment! 🚀
