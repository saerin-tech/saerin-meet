#!/bin/bash

echo "🔍 Verifying Recording Setup"
echo "============================"
echo ""

# Check recordings directory
RECORDINGS_DIR="/Users/ahmed/Projects/saerinmeet/server/recordings"
echo "1. Checking recordings directory..."
if [ -d "$RECORDINGS_DIR" ]; then
    echo "   ✅ Directory exists: $RECORDINGS_DIR"
    echo "   📁 Contents:"
    ls -lh "$RECORDINGS_DIR" 2>/dev/null || echo "   (empty)"
else
    echo "   ❌ Directory does not exist!"
    echo "   Creating directory..."
    mkdir -p "$RECORDINGS_DIR"
    echo "   ✅ Created: $RECORDINGS_DIR"
fi
echo ""

# Check Docker containers
echo "2. Checking Docker containers..."
cd /Users/ahmed/Projects/saerinmeet/livekit
if docker-compose ps | grep -q "egress.*Up"; then
    echo "   ✅ Egress container is running"
else
    echo "   ⚠️  Egress container is not running"
fi

if docker-compose ps | grep -q "livekit.*Up"; then
    echo "   ✅ LiveKit container is running"
else
    echo "   ⚠️  LiveKit container is not running"
fi
echo ""

# Check egress volume mount
echo "3. Checking egress volume mount..."
EGRESS_CONTAINER=$(docker-compose ps -q egress 2>/dev/null)
if [ -n "$EGRESS_CONTAINER" ]; then
    echo "   Container ID: $EGRESS_CONTAINER"
    echo "   Volume mounts:"
    docker inspect $EGRESS_CONTAINER | grep -A 5 "Mounts" | grep -A 2 "/out"
else
    echo "   ⚠️  Egress container not found"
fi
echo ""

# Check .env configuration
echo "4. Checking .env configuration..."
cd /Users/ahmed/Projects/saerinmeet/server
if grep -q "RECORDINGS_PATH=/Users/ahmed/Projects/saerinmeet/server/recordings" .env; then
    echo "   ✅ RECORDINGS_PATH is set to absolute path"
else
    echo "   ⚠️  RECORDINGS_PATH might be relative"
    grep "RECORDINGS_PATH" .env
fi
echo ""

echo "============================"
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. If egress is not running: cd livekit && docker-compose up -d"
echo "2. Start backend: npm run dev:server"
echo "3. Test recording workflow"
