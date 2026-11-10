#!/bin/bash
# Deploy script for Rebeldia FM to VPS via SSH
# Uses pre-built image from GHCR (built by GitHub Actions on push to producao)
# Usage: ./deploy.sh [producao|latest]

set -e

# Configuration
VPS_HOST="root@vps-16147841.oz.com.br"
VPS_PATH="/home/rebeldiafm"
IMAGE_TAG="${1:-producao}"
APP_IMAGE="ghcr.io/ozdigitalweb/rfmv27:${IMAGE_TAG}"

echo "=========================================="
echo "Deploying Rebeldia FM to VPS via SSH"
echo "=========================================="
echo "Host: $VPS_HOST"
echo "Path: $VPS_PATH"
echo "Image: $APP_IMAGE"
echo ""

# 1. Verify .env.production exists locally (for reference)
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found locally"
    echo "   Make sure it exists on VPS at $VPS_PATH/rebeldiafm-current/.env.production"
    echo ""
fi

# 2. Deploy on VPS via SSH
echo "🚀 Deploying on VPS..."
ssh $VPS_HOST << ENDSSH
set -e
cd $VPS_PATH

# Create directory if not exists
mkdir -p rebeldiafm-current
cd rebeldiafm-current

# Copy production env if exists, otherwise create from example
if [ -f ".env.production" ]; then
    echo "✅ Using existing .env.production"
else
    echo "⚠️  Creating .env.production from example..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
    else
        echo "❌ .env.production.example not found!"
        exit 1
    fi
    echo "⚠️  IMPORTANT: Edit .env.production with your actual values!"
fi

# Pull latest image from GHCR
echo "📥 Pulling image: $APP_IMAGE"
docker pull $APP_IMAGE

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose down --remove-orphans || true

# Update docker-compose.yml to use the GHCR image (if using portainer-stack.yml style)
# We'll use a temporary docker-compose override
cat > docker-compose.override.yml << 'EOCOMPOSE'
version: '3.8'

services:
  app:
    image: ${APP_IMAGE:-ghcr.io/ozdigitalweb/rfmv27:producao}
    build: null
    environment:
      - APP_IMAGE=${APP_IMAGE:-ghcr.io/ozdigitalweb/rfmv27:producao}
EOCOMPOSE

# Start new containers with the pulled image
echo "🚀 Starting containers with image: $APP_IMAGE"
APP_IMAGE=$APP_IMAGE docker-compose up -d

# Clean up
docker system prune -f

echo "✅ Deploy completed!"
echo "🌐 Application should be running on port 3000"
ENDSSH

echo ""
echo "=========================================="
echo "✅ Deploy completed successfully!"
echo "=========================================="
echo "VPS: $VPS_HOST"
echo "Path: $VPS_PATH/rebeldiafm-current"
echo "Image: $APP_IMAGE"
echo ""
echo "Next steps:"
echo "1. Check if .env.production has correct values on VPS"
echo "2. Configure reverse proxy (Apache/cPanel) to forward to port 3000"
echo "3. Verify SSL is working"
echo "4. Check logs: ssh $VPS_HOST 'cd $VPS_PATH/rebeldiafm-current && docker-compose logs -f'"
echo ""
echo "Usage: ./deploy.sh [producao|latest|sha-...]"