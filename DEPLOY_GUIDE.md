# Deploy Rebeldia FM to VPS - Complete Guide

## ✅ Project Built Successfully
The project builds correctly locally. Now let's deploy to your VPS.

## 📋 Prerequisites on VPS
Your VPS (root@vps-16147841.oz.com.br) needs:
- Docker & Docker Compose installed
- PostgreSQL (will run in container via docker-compose)
- Apache/cPanel for reverse proxy (you already have this)
- SSL certificates configured (you mentioned you have this)

## 🚀 Quick Deploy Steps

### Option 1: Automated Deploy (Recommended)
Run the deploy script from your local machine:

```powershell
# From E:\www_rebeldia_fm_V2\rebeldiaFM-final
.\deploy.ps1
```

This will:
1. Build the project locally
2. Package everything (excluding node_modules, .git, etc.)
3. Copy to VPS via SCP
4. Extract on VPS
5. Install dependencies
6. Build Docker images
7. Start containers with PostgreSQL

### Option 2: Manual Step-by-Step

#### 1. Copy files to VPS
```powershell
# Create package
tar -czf deploy-package.tar.gz --exclude=node_modules --exclude=.git --exclude=*.log --exclude=.env* --exclude=dist --exclude=*.md --exclude=.github --exclude=.vscode --exclude=.continue .

# Copy to VPS
scp deploy-package.tar.gz root@vps-16147841.oz.com.br:/home/rebeldiafm/

# On VPS
ssh root@vps-16147841.oz.com.br
cd /home/rebeldiafm
mkdir -p rebeldiafm-current
tar -xzf deploy-package.tar.gz -C rebeldiafm-current
cd rebeldiafm-current
```

#### 2. Configure Environment
```bash
# Copy and edit production env
cp .env.production.example .env.production
nano .env.production  # EDIT THESE VALUES!
```

**Required values to change in `.env.production`:**
```env
# Database (using docker-compose container)
DB_PASSWORD=SUA_SENHA_POSTGRES_SEGURA_AQUI
DATABASE_URL=postgresql://rebeldiafm:SUA_SENHA_POSTGRES_SEGURA_AQUI@db:5432/rebeldiafm?sslmode=disable

# Admin (CHANGE THESE!)
ADMIN_USER=admin@rebeldiafm.com.br
ADMIN_PASSWORD=SUA_SENHA_ADMIN_SUPER_SEGURA_MIN_16_CHARS

# App URL
APP_URL=https://www.rebeldiafm.com.br

# Gemini AI (optional)
GEMINI_API_KEY=sua_chave_aqui
```

#### 3. Build and Start
```bash
# Install dependencies
npm ci --production=false

# Build
npm run build

# Start with Docker Compose
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

## 🔧 Apache/cPanel Reverse Proxy Setup

Since you use WHM/cPanel, add this to your Apache configuration:

### Via WHM (Recommended):
1. **WHM → Service Configuration → Apache Configuration → Include Editor**
2. Select "Pre VirtualHost Include" or "Post VirtualHost Include" → "All Versions"
3. Add the content from `apache-rebeldiafm.conf`
4. Click "Update" → Run `/scripts/rebuildhttpdconf` and restart Apache

### Or manually:
```bash
# Create config file
nano /etc/apache2/conf.d/userdata/ssl/2_4/rebeldiafm/rebeldiafm.conf

# Paste content from apache-rebeldiafm.conf

# Rebuild and reload
/scripts/rebuildhttpdconf
systemctl reload httpd
```

### For your specific domain in cPanel:
The config should be placed for the `rebeldiafm.com.br` account in cPanel.

## 🔍 Verify Deployment

```bash
# Check containers running
docker-compose ps

# Check app health
curl http://127.0.0.1:3000/api/health

# Check via domain
curl https://www.rebeldiafm.com.br/api/health

# View logs
docker-compose logs -f app
docker-compose logs -f db
```

## 📁 File Structure on VPS After Deploy
```
/home/rebeldiafm/
├── rebeldiafm-current/          # Current deployment
│   ├── dist/                    # Built frontend
│   ├── server.cjs               # Built backend
│   ├── docker-compose.yml       # Docker config
│   ├── .env.production          # Your env vars (EDIT THIS!)
│   └── ...
├── rebeldiafm-backup/           # Previous version (auto backup)
└── deploy-package.tar.gz        # Uploaded package
```

## 🛠️ Useful Commands on VPS

```bash
# Restart app
docker-compose restart app

# View logs
docker-compose logs -f --tail=100 app

# Rebuild and restart
docker-compose up -d --build

# Run migrations manually
docker-compose exec app npx tsx server/migrations/migrator.ts

# Backup database
docker-compose exec db pg_dump -U rebeldiafm rebeldiafm > backup_$(date +%Y%m%d).sql

# Update deployment (run deploy script again)
# It automatically backs up current version
```

## ⚠️ Important Notes

1. **Database Password**: Use a strong password for `DB_PASSWORD` in `.env.production`
2. **Admin Password**: Change `ADMIN_PASSWORD` to something secure (min 16 chars)
3. **SSL**: Your cPanel/WHM should handle SSL - ensure the certificate covers `www.rebeldiafm.com.br` and `rebeldiafm.com.br`
4. **Firewall**: Ensure port 3000 is only accessible locally (127.0.0.1:3000 in docker-compose)
5. **Backups**: The deploy script keeps one backup version. Consider setting up automated DB backups.

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| App won't start | Check `docker-compose logs app` |
| DB connection failed | Verify `.env.production` has correct DB_PASSWORD |
| 502 Bad Gateway | Check Apache proxy config, ensure app runs on 127.0.0.1:3000 |
| SSL errors | Verify certificates in cPanel/WHM for rebeldiafm.com.br |
| Migrations fail | Run `docker-compose exec app npx tsx server/migrations/migrator.ts` |

## 📞 Support Files Created
- `deploy.ps1` - PowerShell deploy script
- `deploy.sh` - Bash deploy script  
- `.env.production` - Template for production env
- `nginx-rebeldiafm.conf` - Nginx config (reference)
- `apache-rebeldiafm.conf` - Apache/cPanel config (USE THIS)
- `docker-compose.yml` - Updated with PostgreSQL container

---

**Next Step**: Run `.\deploy.ps1` from the project directory, then configure the Apache proxy in WHM/cPanel.