#!/bin/bash

# Chimera Dashboard - Quick Start Script
# This script sets up and runs both frontend and backend locally

set -e

echo "🔥 Chimera Dashboard - Quick Start"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm --version) detected${NC}"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please configure your .env file with Asana credentials${NC}"
fi

# Check if backend port is in use
if check_port 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use${NC}"
    echo "Please stop the process using port 8080 or configure a different port"
fi

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Check if frontend port is in use
if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo "Please stop the process using port 3000 or configure a different port"
fi

cd ..

# Start servers
echo ""
echo "🚀 Starting servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend
echo "Starting backend on http://localhost:8080"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "Check backend.log for details"
    exit 1
fi

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Start frontend
echo "Starting frontend on http://localhost:3000"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 3

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo "Check frontend.log for details"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✨ Chimera Dashboard is running!${NC}"
echo "=================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080"
echo ""
echo "📊 Backend logs: tail -f backend.log"
echo "🎨 Frontend logs: tail -f frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to press Ctrl+C
wait
