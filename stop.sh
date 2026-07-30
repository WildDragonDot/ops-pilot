#!/usr/bin/env bash

echo "=================================================="
echo "🛑 Stopping D-OpsPilot AI Services..."
echo "=================================================="

# 1. Immediate SIGKILL (-9) on ports 5080 & 3000
lsof -ti :5080 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# 2. Silent force-kill (-9) on tsx watch and vite to prevent dying log messages
pkill -9 -f "tsx" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true

sleep 0.5

echo "✅ Backend Service (Port 5080) Stopped."
echo "✅ Frontend Service (Port 3000) Stopped."
echo "✅ All tsx watcher processes force-terminated silently."
echo "=================================================="
echo "🎉 D-OpsPilot AI successfully shut down!"
echo "=================================================="
