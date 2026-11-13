# Deploy Rebeldia FM via WHM Terminal (cPanel/WHM)
# ================================================
# Since SSH isn't working from your machine, run these commands
# DIRECTLY in WHM → Terminal (or cPanel → Terminal)

# ============================================================
# STEP 1: Open WHM Terminal
# ============================================================
# 1. Login to WHM at http://129.121.33.84:2082
# 2. Go to: Server Configuration → Terminal (or search "Terminal")
# 3. Run the commands below

# ============================================================
# STEP 2: Run these commands in WHM Terminal
# ============================================================

# Navigate to deploy directory
cd /home/rebeldiafm

# Download the deploy script
curl -fsSL https://raw.githubusercontent.com/ozdigitalweb/RFMv27/producao/vps-deploy.sh -o vps-deploy.sh
chmod +x vps-deploy.sh

# Run deploy (uses producao branch by default)
./vps-deploy.sh producao

# ============================================================
# OR: Run everything in one command
# ============================================================
# cd /home/rebeldiafm && curl -fsSL https://raw.githubusercontent.com/ozdigitalweb/RFMv27/producao/vps-deploy.sh | bash -s producao

# ============================================================
# STEP 3: After deploy, verify
# ============================================================
# In WHM Terminal:
# docker-compose ps
# curl http://127.0.0.1:3000/api/health

# ============================================================
# STEP 4: Configure Apache/cPanel Proxy (if not done)
# ============================================================
# In WHM → Service Configuration → Apache Configuration → Include Editor
# Select: "Post VirtualHost Include" → "All Versions"
# Add this config (from apache-rebeldiafm.conf):
#
# <IfModule mod_proxy.c>
#     <IfModule mod_proxy_http.c>
#         <IfModule mod_proxy_wstunnel.c>
#             ProxyPass /socket.io/ ws://127.0.0.1:3000/socket.io/
#             ProxyPassReverse /socket.io/ ws://127.0.0.1:3000/socket.io/
#         </IfModule>
#         ProxyPass / http://127.0.0.1:3000/
#         ProxyPassReverse / http://127.0.0.1:3000/
#         ProxyPreserveHost On
#         RequestHeader set X-Forwarded-Proto "https"
#         RequestHeader set X-Forwarded-Port "443"
#         RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
#         ProxyTimeout 300
#         <Proxy http://127.0.0.1:3000>
#             ProxySet connectiontimeout=5 timeout=300 keepalive=On
#         </Proxy>
#     </IfModule>
# </IfModule>
#
# Then: /scripts/rebuildhttpdconf && systemctl reload httpd

# ============================================================
# STEP 5: Verify SSL/Domain
# ============================================================
# Test: curl -I https://www.rebeldiafm.com.br/api/health
# Should return 200 OK

# ============================================================
# TROUBLESHOOTING
# ============================================================
# View logs:
# cd /home/rebeldiafm/rebeldiafm-current && docker-compose logs -f

# Check container status:
# docker-compose ps

# Restart if needed:
# docker-compose restart

# Rebuild:
# docker-compose up -d --build

# Check .env.production:
# cat /home/rebeldiafm/rebeldiafm-current/.env.production