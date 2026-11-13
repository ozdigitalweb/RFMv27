#!/bin/bash
# VPS Deploy Script for Rebeldia FM
# Run this DIRECTLY on the VPS via WHM Terminal or SSH
# Usage: bash vps-deploy.sh [branch]

set -e

# Configuration
BRANCH="${1:-producao}"
REPO_URL="https://github.com/ozdigitalweb/RFMv27.git"
DEPLOY_PATH="/home/rebeldiafm"
PROJECT_DIR="$DEPLOY_PATH/rebeldiafm-current"
BACKUP_DIR="$DEPLOY_PATH/rebeldiafm-backup"

echo "=========================================="
echo "VPS Deploy - Rebeldia FM"
echo "Branch: $BRANCH"
echo "Path: $PROJECT_DIR"
echo "=========================================="

cd $DEPLOY_PATH

# 1. Backup current deployment
if [ -d "$PROJECT_DIR" ]; then
    echo "📦 Backing up current deployment..."
    rm -rf "$BACKUP_DIR"
    mv "$PROJECT_DIR" "$BACKUP_DIR"
fi

# 2. Clone or pull latest code
echo "📥 Getting latest code from $BRANCH branch..."
if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    git clone -b $BRANCH $REPO_URL "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 3. Ensure .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  Creating .env.production from example..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
    else
        echo "❌ .env.production.example not found!"
        exit 1
    fi
    echo "⚠️  IMPORTANT: Edit .env.production with your actual values!"
    echo "   nano .env.production"
    exit 1
else
    echo "✅ Using existing .env.production"
fi

# 4. Check docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found!"
    exit 1
fi

# 5. Stop old containers
echo "🛑 Stopping old containers..."
docker-compose down --remove-orphans || true

# 6. Build and start new containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# 7. Clean up
echo "🧹 Cleaning up..."
docker system prune -f

# 8. Verify deployment
echo "🔍 Verifying deployment..."
sleep 10

echo "Container status:"
docker-compose ps

echo ""
echo "Health check:"
for i in {1..15}; do
    if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    echo "   Waiting... ($i/15)"
    sleep 2
done

echo ""
echo "=========================================="
echo "✅ Deploy completed!"
echo "=========================================="
echo "Project: $PROJECT_DIR"
echo "Branch: $BRANCH"
echo ""
echo "Next steps:"
echo "1. Verify .env.production has correct values"
echo "2. Ensure Apache/cPanel proxies to 127.0.0.1:3000"
echo "3. Check: curl https://www.rebeldiafm.com.br/api/health"
echo "4. View logs: docker-compose logs -f"