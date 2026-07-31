#!/usr/bin/env bash

# Exit immediately if a command fails during setup
set -e

# Function to clean up background processes on exit (e.g. Ctrl+C)
cleanup() {
    echo ""
    echo "Stopping OpsPilot AI services..."
    trap - SIGINT SIGTERM EXIT
    pkill -P $$ 2>/dev/null || true
    lsof -ti :5080 | xargs kill -9 2>/dev/null || true
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    exit 0
}

# Trap termination signals
trap cleanup SIGINT SIGTERM EXIT

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "🚀 Starting D-OpsPilot AI (Backend & Frontend)"
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

echo "⚙️  Generating Prisma Client for PostgreSQL..."
(cd "$ROOT_DIR/backend" && npx prisma generate)

# Free ports 5080 and 3000 if already occupied
lsof -ti :5080 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start Backend Service first
echo "⚙️  Starting Backend Service (Port 5080)..."
(cd "$ROOT_DIR/backend" && npm run dev) &

# Wait until backend is active on port 5080 before launching frontend
echo "⏳ Waiting for Backend to be ready on port 5080..."
for i in {1..20}; do
    if lsof -i :5080 >/dev/null 2>&1 || curl -s http://127.0.0.1:5080/api/health >/dev/null 2>&1 || nc -z 127.0.0.1 5080 2>/dev/null; then
        echo "✅ Backend is active!"
        break
    fi
    sleep 0.4
done

# Start Frontend Service
echo "💻 Starting Frontend Service (Port 3000)..."
(cd "$ROOT_DIR/frontend" && npm run dev) &

echo "=================================================="
echo "✅ Both Backend (5080) and Frontend (3000) are running!"
echo "Press Ctrl+C to stop both servers."
echo "=================================================="

# Keep script running to maintain background jobs
wait
