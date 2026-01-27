#!/bin/bash

# Development startup script for IGI Contest Platform

echo "🚀 Starting IGI Contest Platform..."
echo ""

# Check if we're in the root directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the IGI root directory"
    exit 1
fi

# Check for environment files
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found. Copy from backend/.env.example"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Warning: frontend/.env.local not found. Copy from frontend/.env.example"
fi

echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
echo "  → Backend..."
if [ ! -d "backend/node_modules" ]; then
    (cd backend && npm install --silent)
fi

# Install frontend dependencies
echo "  → Frontend..."
if [ ! -d "frontend/node_modules" ]; then
    (cd frontend && npm install --silent)
fi

echo ""
echo "✅ Dependencies installed"
echo ""
echo "🎯 Starting servers..."
echo "  → Backend: http://localhost:4000"
echo "  → Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to handle script exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Start backend in background using the npm script defined in package.json
# We use setsid to ensuring we can kill the whole group if needed, but simple backgrounding usually works
npm run backend:dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in foreground
npm run frontend:dev

# When frontend stops (if it exits cleanly), cleanup
cleanup
