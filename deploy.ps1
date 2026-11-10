<# 
.SYNOPSIS
    Deploy script for Rebeldia FM to VPS via SSH
.DESCRIPTION
    Uses pre-built image from GHCR (built by GitHub Actions on push to producao)
    Deploys to VPS using Docker Compose with GHCR image
.NOTES
    Requires: SSH access to VPS, Docker & Docker Compose installed on VPS
#>

param(
    [string]$VpsHost = "root@vps-16147841.oz.com.br",
    [string]$VpsPath = "/home/rebeldiafm",
    [string]$ImageTag = "producao"
)

$ErrorActionPreference = "Stop"

$AppImage = "ghcr.io/ozdigitalweb/rfmv27:$ImageTag"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploying Rebeldia FM to VPS via SSH" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Host: $VpsHost"
Write-Host "Path: $VpsPath"
Write-Host "Image: $AppImage"
Write-Host ""

# 1. Verify .env.production exists locally (for reference)
if (-not (Test-Path ".env.production")) {
    Write-Host "⚠️  .env.production not found locally" -ForegroundColor Yellow
    Write-Host "   Make sure it exists on VPS at $VpsPath/rebeldiafm-current/.env.production" -ForegroundColor Yellow
    Write-Host ""
}

# 2. Deploy on VPS via SSH
Write-Host "🚀 Deploying on VPS..." -ForegroundColor Yellow

$sshCommand = @"
set -e
cd $VpsPath

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
echo "📥 Pulling image: $AppImage"
docker pull $AppImage

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose down --remove-orphans || true

# Create docker-compose override for GHCR image
cat > docker-compose.override.yml << 'EOCOMPOSE'
version: '3.8'

services:
  app:
    image: \${APP_IMAGE:-ghcr.io/ozdigitalweb/rfmv27:producao}
    build: null
    environment:
      - APP_IMAGE=\${APP_IMAGE:-ghcr.io/ozdigitalweb/rfmv27:producao}
EOCOMPOSE

# Start new containers with the pulled image
echo "🚀 Starting containers with image: $AppImage"
APP_IMAGE=$AppImage docker-compose up -d

# Clean up
docker system prune -f

echo "✅ Deploy completed!"
echo "🌐 Application should be running on port 3000"
"@

ssh $VpsHost $sshCommand

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Deploy completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "VPS: $VpsHost"
Write-Host "Path: $VpsPath/rebeldiafm-current"
Write-Host "Image: $AppImage"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check if .env.production has correct values on VPS"
Write-Host "2. Configure reverse proxy (Apache/cPanel) to forward to port 3000"
Write-Host "3. Verify SSL is working"
Write-Host "4. Check logs: ssh $VpsHost 'cd $VpsPath/rebeldiafm-current && docker-compose logs -f'"
Write-Host ""
Write-Host "Usage: .\deploy.ps1 [-ImageTag producao|latest|sha-...]"