# SaerinMeet - LiveKit Setup Guide

This guide will help you set up your own LiveKit infrastructure for SaerinMeet.

## Option 1: LiveKit Cloud (Easiest)

### Step 1: Create Account
1. Go to [https://cloud.livekit.io/](https://cloud.livekit.io/)
2. Sign up for a free account
3. Verify your email

### Step 2: Create a Project
1. Click "Create Project"
2. Give your project a name (e.g., "SaerinMeet Production")
3. Select a region closest to your users

### Step 3: Get Credentials
1. Go to "Settings" → "API Keys"
2. Click "Create Key"
3. Copy the following:
   - API Key
   - API Secret
   - WebSocket URL (wss://your-project.livekit.cloud)

### Step 4: Configure SaerinMeet
Add to your `server/.env`:
```env
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LIVEKIT_URL=wss://your-project.livekit.cloud
```

## Option 2: Self-Hosted with Docker (Recommended for Production)

### Prerequisites
- Docker and Docker Compose installed
- A server with public IP address
- Domain name (optional but recommended)

### Step 1: Create Docker Compose File

Create `livekit/docker-compose.yml`:

```yaml
version: '3.9'

services:
  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    restart: unless-stopped
    ports:
      - "7880:7880"    # HTTP
      - "7881:7881"    # WebRTC TCP
      - "7882:7882/udp" # WebRTC UDP
      - "50000-60000:50000-60000/udp" # WebRTC media
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    environment:
      - LIVEKIT_CONFIG=/etc/livekit.yaml

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

### Step 2: Create Configuration File

Create `livekit/livekit.yaml`:

```yaml
port: 7880
bind_addresses:
  - "0.0.0.0"

rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  tcp_port: 7881
  udp_port: 7882

redis:
  address: redis:6379

keys:
  # Generate these with: openssl rand -base64 32
  API_Key: API89e02ebcc4a4764a
  API_Secret: Vh3j/oCUQSBmOGKXObQR6zumI6wxW6lK+hECSFJs7KA=

room:
  auto_create: true
  empty_timeout: 300
  max_participants: 100

turn:
  enabled: true
  domain: your-domain.com
  tls_port: 443
  udp_port: 3478
  external_tls: true

logging:
  level: info
  sample: false
```

### Step 3: Generate API Keys

```bash
# Generate API Key (any string, e.g., APIkey1234567890)
API_KEY="API$(openssl rand -hex 8)"

# Generate API Secret
API_SECRET=$(openssl rand -base64 32)

echo "API Key: $API_KEY"
echo "API Secret: $API_SECRET"
```

Update `livekit.yaml` with your generated keys.

### Step 4: Start LiveKit Server

```bash
cd livekit
docker-compose up -d
```

### Step 5: Configure SaerinMeet

Add to `server/.env`:
```env
LIVEKIT_API_KEY=APIkey1234567890
LIVEKIT_API_SECRET=your_generated_secret
LIVEKIT_URL=ws://your-server-ip:7880
# Or with SSL: wss://your-domain.com
```

### Step 6: Setup SSL (Recommended)

Using Nginx as reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name livekit.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Option 3: Kubernetes Deployment (Advanced)

### Step 1: Add LiveKit Helm Repository

```bash
helm repo add livekit https://helm.livekit.io
helm repo update
```

### Step 2: Create Values File

Create `livekit-values.yaml`:

```yaml
livekit:
  config:
    keys:
      APIkey1234567890: your_secret_key_here
    room:
      auto_create: true
      max_participants: 100
    
  redis:
    enabled: true
  
  ingress:
    enabled: true
    hosts:
      - host: livekit.yourdomain.com
        paths:
          - path: /
            pathType: Prefix

  service:
    type: LoadBalancer
```

### Step 3: Install with Helm

```bash
kubectl create namespace livekit

helm install livekit livekit/livekit \
  --namespace livekit \
  --values livekit-values.yaml
```

## Testing Your LiveKit Setup

### 1. Health Check

```bash
curl http://your-livekit-server:7880/
```

### 2. Test with LiveKit CLI

Install LiveKit CLI:
```bash
# macOS
brew install livekit

# Linux
curl -sSL https://get.livekit.io/cli | bash
```

Create a test room:
```bash
livekit-cli create-room \
  --url wss://your-livekit-server \
  --api-key APIkey1234567890 \
  --api-secret your_secret \
  --room test-room
```

### 3. Test Token Generation

```bash
livekit-cli create-token \
  --url wss://your-livekit-server \
  --api-key APIkey1234567890 \
  --api-secret your_secret \
  --room test-room \
  --identity test-user \
  --valid-for 1h
```

## Configuring TURN Server (For Better Connectivity)

### Option 1: coturn (Self-hosted)

Install coturn:
```bash
# Ubuntu/Debian
sudo apt-get install coturn
```

Configure `/etc/turnserver.conf`:
```conf
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=YOUR_SERVER_IP
external-ip=YOUR_SERVER_IP
realm=yourdomain.com
server-name=yourdomain.com
lt-cred-mech
user=turnuser:turnpassword
no-stdout-log
```

Add to LiveKit config:
```yaml
turn:
  enabled: true
  domain: yourdomain.com
  tls_port: 5349
  udp_port: 3478
  username: turnuser
  password: turnpassword
```

### Option 2: Use Managed TURN Service

- [Twilio TURN](https://www.twilio.com/stun-turn)
- [Metered TURN](https://www.metered.ca/turn-server)
- [Xirsys](https://xirsys.com/)

## Firewall Configuration

Open these ports on your server:

```bash
# LiveKit HTTP
sudo ufw allow 7880/tcp

# WebRTC TCP
sudo ufw allow 7881/tcp

# WebRTC UDP
sudo ufw allow 7882/udp

# WebRTC Media
sudo ufw allow 50000:60000/udp

# TURN (if using)
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
```

## Monitoring and Logs

### View Docker Logs
```bash
docker-compose logs -f livekit
```

### Access LiveKit Metrics
LiveKit exposes Prometheus metrics at:
```
http://your-server:7880/metrics
```

### Setup Grafana Dashboard
1. Install Prometheus and Grafana
2. Import LiveKit dashboard: https://grafana.com/grafana/dashboards/15561

## Scaling Considerations

### For Production:
1. **Load Balancing**: Use multiple LiveKit instances behind a load balancer
2. **Redis Cluster**: Use Redis cluster for session management
3. **Geographic Distribution**: Deploy LiveKit servers in multiple regions
4. **CDN**: Use CDN for TURN servers
5. **Monitoring**: Set up Prometheus + Grafana for monitoring

### Estimated Capacity (per instance):
- **Small** (2 CPU, 4GB RAM): ~50 concurrent participants
- **Medium** (4 CPU, 8GB RAM): ~100-150 concurrent participants
- **Large** (8 CPU, 16GB RAM): ~300-500 concurrent participants

## Troubleshooting

### Connection Issues
1. Check firewall rules
2. Verify public IP configuration
3. Test with browser console: `window.location.protocol`
4. Check WebSocket connectivity

### Audio/Video Issues
1. Enable TURN server
2. Check bandwidth requirements
3. Adjust video quality settings
4. Monitor server resources

### Recording Issues
1. Ensure sufficient disk space
2. Check egress service is running
3. Verify file permissions
4. Monitor CPU usage during recording

## Cost Estimates

### LiveKit Cloud
- **Free Tier**: 10,000 minutes/month
- **Starter**: $99/month (50,000 minutes)
- **Pro**: Custom pricing

### Self-Hosted (AWS/DigitalOcean)
- **Basic** (t3.medium): ~$30-50/month
- **Production** (c5.2xlarge): ~$200-300/month
- **High-Scale**: $500+/month

### Additional Costs
- **Bandwidth**: $0.05-0.12 per GB
- **Storage** (recordings): $0.02-0.05 per GB/month
- **TURN Server**: $20-50/month

## Security Best Practices

1. **Use SSL/TLS** - Always use wss:// in production
2. **Rotate API Keys** - Change keys periodically
3. **Rate Limiting** - Implement rate limiting on token generation
4. **Network Security** - Use VPC/firewall rules
5. **Monitoring** - Set up alerts for unusual activity
6. **Access Control** - Restrict LiveKit server access

## Next Steps

After setting up LiveKit:
1. Update your SaerinMeet `.env` file
2. Test the connection from your app
3. Configure recording storage
4. Set up monitoring
5. Plan for scaling

For more information, visit [LiveKit Documentation](https://docs.livekit.io/)
