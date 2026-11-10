#!/bin/bash
# Deploy script for Rebeldia FM to VPS
# Usage: ./deploy.sh

set -e

# Configuration
VPS_HOST="root@vps-16147841.oz.com.br"
VPS_PATH="/home/rebeldiafm"
PROJECT_NAME="rebeldiafm"

echo "=========================================="
echo "Deploying Rebeldia FM to VPS"
echo "=========================================="
echo "Host: $VPS_HOST"
echo "Path: $VPS_PATH"
echo ""

# 1. Build the project locally
echo "📦 Building project locally..."
npm run build

# 2. Create deployment package
echo "📦 Creating deployment package..."
tar -czf deploy-package.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=*.log \
  --exclude=.env \
  --exclude=.env.local \
  --exclude=.env.*.local \
  --exclude=dist \
  --exclude=deploy-package.tar.gz \
  --exclude=deploy.sh \
  --exclude=*.md \
  --exclude=*.txt \
  --exclude=.github \
  --exclude=.vscode \
  --exclude=.continue \
  .

# 3. Copy to VPS
echo "📤 Copying to VPS..."
scp deploy-package.tar.gz $VPS_HOST:$VPS_PATH/

# 4. Deploy on VPS
echo "🚀 Deploying on VPS..."
ssh $VPS_HOST << 'ENDSSH'
set -e
cd /home/rebeldiafm

# Backup current version if exists
if [ -d "rebeldiafm-current" ]; then
    echo "📦 Backing up current version..."
    rm -rf rebeldiafm-backup
    mv rebeldiafm-current rebeldiafm-backup
fi

# Extract new version
echo "📦 Extracting new version..."
mkdir -p rebeldiafm-current
tar -xzf deploy-package.tar.gz -C rebeldiafm-current
rm deploy-package.tar.gz

cd rebeldiafm-current

# Copy production env if exists, otherwise create from example
if [ -f ".env.production" ]; then
    echo "✅ Using existing .env.production"
else
    echo "⚠️  Creating .env.production from example..."
    cp .env.production.example .env.production
    echo "⚠️  IMPORTANT: Edit .env.production with your actual values!"
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
npm ci --production=false

echo "🔨 Building application..."
npm run build

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose down --remove-orphans || true

# Start new containers
echo "🚀 Starting new containers..."
docker-compose up -d --build

# Clean up
docker system prune -f

echo "✅ Deploy completed!"
echo "🌐 Application should be running on port 3000"
ENDSSH

# 5. Cleanup local package
rm deploy-package.tar.gz

echo ""
echo "=========================================="
echo "✅ Deploy completed successfully!"
echo "=========================================="
echo "VPS: $VPS_HOST"
echo "Path: $VPS_PATH/rebeldiafm-current"
echo ""
echo "Next steps:"
echo "1. Check if .env.production has correct values on VPS"
echo "2. Configure reverse proxy (nginx/Caddy) to forward to port 3000"
echo "3. Verify SSL is working"
echo "4. Check logs: ssh $VPS_HOST 'cd $VPS_PATH/rebeldiafm-current && docker-compose logs -f'"