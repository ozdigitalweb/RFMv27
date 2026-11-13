<# 
.SYNOPSIS
    Deploy script for Rebeldia FM to VPS via SSH - Updated for producao branch
.DESCRIPTION
    Deploys to VPS using Docker Compose. Tries GHCR image first (built by GitHub Actions on push to producao),
    falls back to local build if image not available.
.NOTES
    Requires: SSH access to VPS, Docker & Docker Compose installed on VPS
    VPS: root@129.121.33.84 (or root@vps-16147841.oz.com.br)
    Path: /home/rebeldiafm
#>

param(
    [string]$VpsHost = "root@129.121.33.84",
    [int]$SshPort = 22022,
    [string]$VpsPath = "/home/rebeldiafm",
    [string]$ImageTag = "producao",
    [switch]$ForceLocalBuild,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$AppImage = "ghcr.io/ozdigitalweb/rfmv27:$ImageTag"
$RepoUrl = "https://github.com/ozdigitalweb/RFMv27"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Deploy Rebeldia FM - Branch: producao" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VPS: $VpsHost"
Write-Host "Path: $VpsPath"
Write-Host "Image: $AppImage"
Write-Host "Repo: $RepoUrl"
Write-Host ""

# Function to check if GHCR image exists locally
function Test-GhcrImage {
    param($image)
    try {
        $result = docker manifest inspect $image 2>$null
        return $result -ne $null
    } catch {
        return $false
    }
}

# 1. Determine deployment strategy
$useGhcr = -not $ForceLocalBuild
if ($useGhcr) {
    Write-Host "Checking if GHCR image exists locally: $AppImage" -ForegroundColor Yellow
    if (Test-GhcrImage $AppImage) {
        Write-Host "GHCR image found: $AppImage" -ForegroundColor Green
    } else {
        Write-Host "GHCR image not found locally, will try on VPS" -ForegroundColor Yellow
    }
} else {
    Write-Host "Force local build enabled" -ForegroundColor Yellow
}

# 2. Build locally if needed (fallback)
if (-not $useGhcr -or $ForceLocalBuild) {
    if (-not $SkipBuild) {
        Write-Host "Building project locally..." -ForegroundColor Yellow
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed!"
            exit 1
        }
    }
}

# 3. Deploy on VPS via SSH
Write-Host "Deploying on VPS via SSH..." -ForegroundColor Yellow

# Build the SSH command as a string to avoid parsing issues
$sshCommand = @"
set -e
cd $VpsPath

# Create directory if not exists
mkdir -p rebeldiafm-current
cd rebeldiafm-current

# Ensure .env.production exists
if [ ! -f ".env.production" ]; then
    echo ".env.production not found, creating from example..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
    else
        echo ".env.production.example not found!"
        exit 1
    fi
    echo "IMPORTANT: Edit .env.production with your actual values!"
else
    echo "Using existing .env.production"
fi

# Ensure docker-compose.yml exists (with DB service)
if [ ! -f "docker-compose.yml" ]; then
    echo "docker-compose.yml not found!"
    exit 1
fi

# Strategy: Try GHCR image first, fallback to local build
IMAGE_TO_USE="$AppImage"

echo "Trying to pull GHCR image: $IMAGE_TO_USE"
if docker pull $IMAGE_TO_USE 2>/dev/null; then
    echo "GHCR image pulled successfully"
    USE_GHCR=true
else
    echo "GHCR image not available, will build locally on VPS"
    USE_GHCR=false
fi

# Create docker-compose override
if [ "$USE_GHCR" = "true" ]; then
    cat > docker-compose.override.yml << 'EOCOMPOSE'
version: '3.8'

services:
  app:
    image: ${APP_IMAGE:-ghcr.io/ozdigitalweb/rfmv27:producao}
    build: null
    environment:
      - APP_IMAGE=${APP_IMAGE:-ghcr.io/ozdigitalweb/rfmv27:producao}
EOCOMPOSE
    echo "Created docker-compose.override.yml for GHCR image"
else
    # Remove override if exists
    rm -f docker-compose.override.yml
    echo "Using local build (no override)"
fi

# Stop old containers
echo "Stopping old containers..."
docker-compose down --remove-orphans || true

# Start new containers
if [ "$USE_GHCR" = "true" ]; then
    echo "Starting containers with GHCR image: $IMAGE_TO_USE"
    APP_IMAGE=$IMAGE_TO_USE docker-compose up -d
else
    echo "Building and starting containers locally on VPS..."
    docker-compose up -d --build
fi

# Clean up
docker system prune -f

# Verify deployment
sleep 5
echo "Checking container status..."
docker-compose ps

echo "Checking health endpoint..."
for i in {1..10}; do
    if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
        echo "Health check passed!"
        break
    fi
    echo "   Waiting for health check... ($i/10)"
    sleep 3
done

echo "Deploy completed!"
echo "Application running on port 3000"
"@

# Execute SSH command
try {
    Write-Host "Connecting to VPS: $VpsHost on port $SshPort" -ForegroundColor Yellow
    ssh -p $SshPort $VpsHost $sshCommand
} catch {
    Write-Error "SSH deployment failed: $_"
    Write-Host "Trying alternative host..." -ForegroundColor Yellow
    
    # Try with hostname
    $altHost = "root@vps-16147841.oz.com.br"
    if ($VpsHost -ne $altHost) {
        Write-Host "Trying $altHost on port $SshPort..." -ForegroundColor Yellow
        ssh -p $SshPort $altHost $sshCommand
    } else {
        throw
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Deploy completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "VPS: $VpsHost"
Write-Host "Path: $VpsPath/rebeldiafm-current"
Write-Host "Image: $AppImage"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify .env.production has correct values on VPS"
Write-Host "2. Ensure Apache/cPanel reverse proxy forwards to 127.0.0.1:3000"
Write-Host "3. Check SSL is working at https://www.rebeldiafm.com.br"
Write-Host "4. View logs: ssh $VpsHost 'cd $VpsPath/rebeldiafm-current && docker-compose logs -f'"
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  .\deploy-prod.ps1                    # Auto-detect (GHCR or local)"
Write-Host "  .\deploy-prod.ps1 -ForceLocalBuild   # Force local build on VPS"
Write-Host "  .\deploy-prod.ps1 -SkipBuild         # Skip local build (use existing dist)"
Write-Host "  .\deploy-prod.ps1 -ImageTag latest   # Use different image tag"