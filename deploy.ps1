<# 
.SYNOPSIS
    Deploy script for Rebeldia FM to VPS via SSH
.DESCRIPTION
    Builds the project locally, packages it, and deploys to VPS using Docker Compose
.NOTES
    Requires: SSH access to VPS, Docker & Docker Compose installed on VPS
#>

param(
    [string]$VpsHost = "root@vps-16147841.oz.com.br",
    [string]$VpsPath = "/home/rebeldiafm",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploying Rebeldia FM to VPS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Host: $VpsHost"
Write-Host "Path: $VpsPath"
Write-Host ""

# 1. Build the project locally
if (-not $SkipBuild) {
    Write-Host "📦 Building project locally..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed!"
        exit 1
    }
}

# 2. Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
$excludePatterns = @(
    "node_modules",
    ".git",
    "*.log",
    ".env",
    ".env.local",
    ".env.*.local",
    "dist",
    "deploy-package.tar.gz",
    "deploy.ps1",
    "*.md",
    "*.txt",
    ".github",
    ".vscode",
    ".continue"
)

# Create tar.gz using tar (available in Windows 10+)
$excludeArgs = $excludePatterns | ForEach-Object { "--exclude=$_" }
tar -czf deploy-package.tar.gz @excludeArgs .

# 3. Copy to VPS
Write-Host "📤 Copying to VPS..." -ForegroundColor Yellow
scp deploy-package.tar.gz "$VpsHost:$VpsPath/"

# 4. Deploy on VPS
Write-Host "🚀 Deploying on VPS..." -ForegroundColor Yellow
$sshCommand = @"
set -e
cd $VpsPath

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
"@

ssh $VpsHost $sshCommand

# 5. Cleanup local package
Remove-Item deploy-package.tar.gz -Force

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Deploy completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "VPS: $VpsHost"
Write-Host "Path: $VpsPath/rebeldiafm-current"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check if .env.production has correct values on VPS"
Write-Host "2. Configure reverse proxy (nginx/Caddy) to forward to port 3000"
Write-Host "3. Verify SSL is working"
Write-Host "4. Check logs: ssh $VpsHost 'cd $VpsPath/rebeldiafm-current && docker-compose logs -f'"