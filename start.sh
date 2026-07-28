#!/usr/bin/env bash

# Exit immediately if a command fails during setup
set -e

# Function to clean up background processes on exit (e.g. Ctrl+C)
cleanup() {
    echo ""
    echo "Stopping OpsPilot AI services..."
    # Kill all child jobs running in background
    trap - SIGINT SIGTERM EXIT
    kill 0 2>/dev/null
    exit 0
}

# Trap termination signals
trap cleanup SIGINT SIGTERM EXIT

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "🚀 Starting OpsPilot AI (Backend & Frontend)"
echo "=================================================="

# Check if node_modules exist, if not run npm install
if [ ! -d "$ROOT_DIR/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    (cd "$ROOT_DIR/backend" && npm install)
fi

if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    (cd "$ROOT_DIR/frontend" && npm install)
fi

# Start Backend
echo "⚙️  Starting Backend Service..."
(cd "$ROOT_DIR/backend" && npm run dev) &

# Start Frontend
echo "💻 Starting Frontend Service..."
(cd "$ROOT_DIR/frontend" && npm run dev) &

echo "=================================================="
echo "✅ Both Backend and Frontend are running!"
echo "Press Ctrl+C to stop both servers."
echo "=================================================="

# Keep script running to maintain background jobs
wait
