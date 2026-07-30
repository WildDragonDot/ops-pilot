#!/usr/bin/env bash

echo "=================================================="
echo "🛑 Stopping D-OpsPilot AI Services..."
echo "=================================================="

# 1. Kill processes listening on port 5080 (Backend) and port 3000 (Frontend)
lsof -ti :5080 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# 2. Force terminate tsx watch and vite dev server processes
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✅ Backend Service (Port 5080) Stopped."
echo "✅ Frontend Service (Port 3000) Stopped."
echo "✅ All background watcher processes terminated."
echo "=================================================="
echo "🎉 D-OpsPilot AI successfully shut down!"
echo "=================================================="
