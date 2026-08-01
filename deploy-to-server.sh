#!/bin/bash

# 🚀 OpsPilot AI - Production Server Deployment Script
# Deploys latest code to ubuntu@54.237.198.207

set -e  # Exit on any error

SERVER="ubuntu@54.237.198.207"
SSH_KEY="~/.ssh/id_rsa_no_pass"
REMOTE_PATH="/home/ubuntu/ops-pilot"
LOCAL_PATH="/Users/chandanvishwakarma/Desktop/Office Project/OpsPilot AI"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 D-OpsPilot AI Production Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Target Server: $SERVER"
echo "📁 Remote Path: $REMOTE_PATH"
echo "🔐 SSH Key: $SSH_KEY"
echo ""

# Test SSH connection first
echo "🔍 Step 1/7: Testing SSH connection..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$SERVER" "echo '✅ SSH connection successful'" || {
  echo "❌ SSH connection failed!"
  exit 1
}
echo ""

# Copy .env file
echo "📦 Step 2/7: Copying .env configuration..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_PATH/backend/.env" "$SERVER:$REMOTE_PATH/backend/.env"
echo "✅ .env copied"
echo ""

# Copy backend source
echo "📦 Step 3/7: Syncing backend source files..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_PATH/backend/package.json" "$SERVER:$REMOTE_PATH/backend/"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_PATH/backend/tsconfig.json" "$SERVER:$REMOTE_PATH/backend/"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r "$LOCAL_PATH/backend/src" "$SERVER:$REMOTE_PATH/backend/"
echo "✅ Backend source synced"
echo ""

# Copy frontend source
echo "📦 Step 4/7: Syncing frontend source files..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r "$LOCAL_PATH/frontend/src" "$SERVER:$REMOTE_PATH/frontend/"
echo "✅ Frontend source synced"
echo ""

# Build and restart backend
echo "⚙️  Step 5/7: Building backend & restarting PM2..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'BACKEND_DEPLOY'
cd /home/ubuntu/ops-pilot/backend
echo "📥 Installing backend dependencies..."
npm install --production=false
echo "🔨 Cleaning old build & compiling TypeScript..."
rm -rf dist
npx tsc
echo "🔄 Freeing port 5080 & restarting PM2 process..."
pm2 delete opspilot-backend 2>/dev/null || true
fuser -k -9 5080/tcp 2>/dev/null || true
pkill -9 -f "node dist/index.js" 2>/dev/null || true
sleep 1
pm2 start dist/index.js --name opspilot-backend
pm2 save
echo "✅ Backend deployment complete"
BACKEND_DEPLOY
echo ""

# Build and reload frontend
echo "⚙️  Step 6/7: Building frontend & reloading Nginx..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'FRONTEND_DEPLOY'
cd ~/ops-pilot/frontend
echo "📥 Installing frontend dependencies..."
npm install --production=false
echo "🔨 Building Vite production bundle..."
npm run build
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx
echo "✅ Frontend deployment complete"
FRONTEND_DEPLOY
echo ""

# Verify deployment
echo "🔍 Step 7/7: Verifying deployment..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'VERIFY'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔹 PM2 Backend Status:"
pm2 list | grep opspilot-backend || echo "⚠️  Backend process not found"
echo ""
echo "🔹 Nginx Status:"
sudo systemctl status nginx --no-pager | grep "Active:" || echo "⚠️  Nginx status unknown"
echo ""
echo "🔹 Backend Health:"
curl -s http://localhost:5080/api/health | head -c 100 || echo "⚠️  Backend health check failed"
echo ""
echo ""
echo "🔹 Frontend Build:"
ls -lh ~/ops-pilot/frontend/dist/index.html 2>/dev/null && echo "✅ Frontend build exists" || echo "⚠️  Frontend build not found"
echo ""
VERIFY

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://54.237.198.207"
echo "   Backend:  http://54.237.198.207:5080/api/health"
echo ""
echo "📝 Useful Commands:"
echo "   View Backend Logs:  ssh -i $SSH_KEY $SERVER 'pm2 logs opspilot-backend'"
echo "   View Nginx Logs:    ssh -i $SSH_KEY $SERVER 'sudo tail -f /var/log/nginx/error.log'"
echo "   Restart Backend:    ssh -i $SSH_KEY $SERVER 'pm2 restart opspilot-backend'"
echo "   Reload Nginx:       ssh -i $SSH_KEY $SERVER 'sudo systemctl reload nginx'"
echo ""
