#!/bin/bash

# SaerinMeet Setup Checker
# This script checks if your environment is properly configured

echo "🔍 SaerinMeet Setup Checker"
echo "=========================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        if [ ! -z "$2" ]; then
            VERSION=$($1 $2 2>&1)
            echo "  Version: $VERSION"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

# Check Node.js
echo "📦 Checking Prerequisites..."
check_command "node" "--version"
check_command "npm" "--version"
check_command "mongod" "--version" || check_command "mongosh" "--version"
echo ""

# Check if directories exist
echo "📁 Checking Project Structure..."
if [ -d "server" ]; then
    echo -e "${GREEN}✓${NC} server directory exists"
else
    echo -e "${RED}✗${NC} server directory not found"
fi

if [ -d "client" ]; then
    echo -e "${GREEN}✓${NC} client directory exists"
else
    echo -e "${RED}✗${NC} client directory not found"
fi
echo ""

# Check server dependencies
echo "📦 Checking Server Dependencies..."
if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Server dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Server dependencies not installed"
    echo "  Run: cd server && npm install"
fi

# Check server .env
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓${NC} Server .env file exists"
    
    # Check required variables
    if grep -q "MONGODB_URI" server/.env; then
        echo -e "${GREEN}  ✓${NC} MONGODB_URI configured"
    else
        echo -e "${YELLOW}  ⚠${NC} MONGODB_URI not configured"
    fi
    
    if grep -q "JWT_SECRET" server/.env; then
        echo -e "${GREEN}  ✓${NC} JWT_SECRET configured"
    else
        echo -e "${YELLOW}  ⚠${NC} JWT_SECRET not configured"
    fi
    
    if grep -q "LIVEKIT_API_KEY" server/.env; then
        echo -e "${GREEN}  ✓${NC} LIVEKIT_API_KEY configured"
    else
        echo -e "${YELLOW}  ⚠${NC} LIVEKIT_API_KEY not configured"
    fi
    
    if grep -q "LIVEKIT_API_SECRET" server/.env; then
        echo -e "${GREEN}  ✓${NC} LIVEKIT_API_SECRET configured"
    else
        echo -e "${YELLOW}  ⚠${NC} LIVEKIT_API_SECRET not configured"
    fi
    
    if grep -q "LIVEKIT_URL" server/.env; then
        echo -e "${GREEN}  ✓${NC} LIVEKIT_URL configured"
    else
        echo -e "${YELLOW}  ⚠${NC} LIVEKIT_URL not configured"
    fi
else
    echo -e "${YELLOW}⚠${NC} Server .env file not found"
    echo "  Run: cp server/.env.example server/.env"
fi
echo ""

# Check client dependencies
echo "📦 Checking Client Dependencies..."
if [ -d "client/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Client dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Client dependencies not installed"
    echo "  Run: cd client && npm install"
fi

# Check client .env
if [ -f "client/.env" ]; then
    echo -e "${GREEN}✓${NC} Client .env file exists"
    
    if grep -q "VITE_API_URL" client/.env; then
        echo -e "${GREEN}  ✓${NC} VITE_API_URL configured"
    else
        echo -e "${YELLOW}  ⚠${NC} VITE_API_URL not configured"
    fi
else
    echo -e "${YELLOW}⚠${NC} Client .env file not found"
    echo "  Run: cp client/.env.example client/.env"
fi
echo ""

# Check MongoDB connection
echo "🗄️  Checking MongoDB..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo -e "${GREEN}✓${NC} MongoDB is running"
    else
        echo -e "${YELLOW}⚠${NC} MongoDB is not running"
        echo "  Run: brew services start mongodb-community"
    fi
elif command -v mongo &> /dev/null; then
    if mongo --eval "db.version()" --quiet &> /dev/null; then
        echo -e "${GREEN}✓${NC} MongoDB is running"
    else
        echo -e "${YELLOW}⚠${NC} MongoDB is not running"
        echo "  Run: brew services start mongodb-community"
    fi
else
    echo -e "${YELLOW}⚠${NC} MongoDB client not found"
fi
echo ""

# Check ports
echo "🔌 Checking Ports..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠${NC} Port 5000 is already in use"
    echo "  This might be another instance of the backend"
else
    echo -e "${GREEN}✓${NC} Port 5000 is available"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠${NC} Port 3000 is already in use"
    echo "  This might be another instance of the frontend"
else
    echo -e "${GREEN}✓${NC} Port 3000 is available"
fi
echo ""

# Summary
echo "📋 Summary"
echo "=========="
if [ -f "server/.env" ] && [ -f "client/.env" ] && [ -d "server/node_modules" ] && [ -d "client/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Your environment seems properly configured!"
    echo ""
    echo "🚀 Ready to start? Run:"
    echo "   npm run dev"
    echo ""
    echo "Or separately:"
    echo "   npm run dev:server  (backend)"
    echo "   npm run dev:client  (frontend)"
else
    echo -e "${YELLOW}⚠${NC} Some configuration is missing"
    echo ""
    echo "📖 Next steps:"
    echo "1. Install dependencies: npm run install:all"
    echo "2. Configure environment: cp server/.env.example server/.env"
    echo "3. Configure environment: cp client/.env.example client/.env"
    echo "4. Edit .env files with your credentials"
    echo "5. Start MongoDB: brew services start mongodb-community"
    echo "6. Start the app: npm run dev"
    echo ""
    echo "For detailed instructions, see QUICKSTART.md"
fi
echo ""
