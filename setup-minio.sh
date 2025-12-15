#!/bin/bash

# MinIO Setup and Management Script for SaerinMeet

echo "🚀 SaerinMeet MinIO Setup"
echo "=========================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
MINIO_ENDPOINT="http://localhost:9000"
MINIO_CONSOLE="http://localhost:9001"

# Load from .env file if it exists
if [ -f "livekit/.env" ]; then
  source livekit/.env
fi

ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
BUCKET_NAME="recordings"

echo ""
echo "📋 MinIO Configuration:"
echo "  - Endpoint: $MINIO_ENDPOINT"
echo "  - Console: $MINIO_CONSOLE"
echo "  - Access Key: $ACCESS_KEY"
echo "  - Bucket: $BUCKET_NAME"
echo ""

# Function to check if MinIO is running
check_minio() {
  echo "🔍 Checking MinIO status..."
  if curl -s "$MINIO_ENDPOINT/minio/health/live" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO is running${NC}"
    return 0
  else
    echo -e "${RED}❌ MinIO is not running${NC}"
    return 1
  fi
}

# Function to create bucket
create_bucket() {
  echo ""
  echo "📦 Creating bucket '$BUCKET_NAME'..."
  
  # Using mc (MinIO Client) if available
  if command -v mc &> /dev/null; then
    mc alias set local "$MINIO_ENDPOINT" "$ACCESS_KEY" "$SECRET_KEY" > /dev/null 2>&1
    
    if mc ls local/"$BUCKET_NAME" > /dev/null 2>&1; then
      echo -e "${YELLOW}⚠️  Bucket already exists${NC}"
    else
      mc mb local/"$BUCKET_NAME"
      echo -e "${GREEN}✅ Bucket created successfully${NC}"
    fi
    
    # Set bucket policy to allow downloads
    mc anonymous set download local/"$BUCKET_NAME"
    echo -e "${GREEN}✅ Bucket policy configured${NC}"
  else
    echo -e "${YELLOW}⚠️  MinIO Client (mc) not found${NC}"
    echo "   The application will create the bucket automatically on first run"
  fi
}

# Function to list recordings
list_recordings() {
  echo ""
  echo "📁 Recordings in bucket:"
  if command -v mc &> /dev/null; then
    mc alias set local "$MINIO_ENDPOINT" "$ACCESS_KEY" "$SECRET_KEY" > /dev/null 2>&1
    mc ls local/"$BUCKET_NAME"
  else
    echo -e "${YELLOW}⚠️  MinIO Client (mc) not installed. Install with: brew install minio/stable/mc${NC}"
  fi
}

# Function to show MinIO info
show_info() {
  echo ""
  echo "ℹ️  MinIO Access Information:"
  echo "  - Web Console: $MINIO_CONSOLE"
  echo "  - Username: $ACCESS_KEY"
  echo "  - Password: $SECRET_KEY"
  echo ""
  echo "  Open the console in your browser to manage recordings visually"
}

# Main menu
case "${1:-setup}" in
  setup)
    if check_minio; then
      create_bucket
      show_info
    else
      echo ""
      echo -e "${RED}❌ Please start MinIO first:${NC}"
      echo "   cd livekit && docker compose up -d minio"
    fi
    ;;
  
  check)
    check_minio
    ;;
  
  list)
    if check_minio; then
      list_recordings
    fi
    ;;
  
  info)
    show_info
    ;;
  
  *)
    echo "Usage: $0 {setup|check|list|info}"
    echo ""
    echo "Commands:"
    echo "  setup  - Initialize MinIO bucket (default)"
    echo "  check  - Check if MinIO is running"
    echo "  list   - List recordings in bucket"
    echo "  info   - Show MinIO access information"
    exit 1
    ;;
esac

echo ""
echo "✅ Done!"
