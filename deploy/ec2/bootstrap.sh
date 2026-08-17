#!/bin/bash
# =============================================================================
# FiestaLoco — EC2 ilk kurulum (user-data)
# =============================================================================
# Ubuntu 24.04 LTS / t3.micro icin. Instance ilk acildiginda BIR KEZ calisir.
# Cikti: /var/log/cloud-init-output.log
#
# Kurdugu seyler:
#   - 2 GB swap (1 GB RAM'lik kutuda npm install'in OOM olmamasi icin)
#   - Node.js 22 LTS
#   - Caddy (otomatik Let's Encrypt sertifikasi + reverse proxy + WebSocket)
#   - fiesta servis kullanicisi ve /opt/fiestaloco dizin agaci
#   - Gunluk guvenlik yamalari (unattended-upgrades)
#
# Uygulama kodu BURADA kurulmaz — onu scripts/deploy-ec2.sh rsync ile atar.
# =============================================================================
set -euxo pipefail
export DEBIAN_FRONTEND=noninteractive

# --- Swap: 1 GB RAM'de `npm ci` OOM'a girer, 2 GB swap bunu tamamen cozer -----
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
# Swap'i gercekten son care olarak kullan (oyun gecikmesini bozmasin)
sysctl -w vm.swappiness=10
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf

apt-get update
apt-get install -y curl ca-certificates gnupg rsync unattended-upgrades \
  debian-keyring debian-archive-keyring apt-transport-https

# --- Node.js 22 LTS -----------------------------------------------------------
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# --- Caddy (resmi apt deposu) -------------------------------------------------
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# --- Uygulama kullanicisi ve dizinler ----------------------------------------
id -u fiesta >/dev/null 2>&1 || useradd -r -m -d /opt/fiestaloco -s /bin/bash fiesta
mkdir -p /opt/fiestaloco/app
chown -R fiesta:fiesta /opt/fiestaloco

# Ortam dosyasi — gercek degerleri deploy-ec2.sh yaziyor. 0600, sadece root+fiesta.
if [ ! -f /etc/fiestaloco.env ]; then
  cat > /etc/fiestaloco.env <<'ENVEOF'
NODE_ENV=production
PORT=3000
SERVE_STATIC=false
ENVEOF
  chown root:fiesta /etc/fiestaloco.env
  chmod 640 /etc/fiestaloco.env
fi

# --- Otomatik guvenlik yamalari ----------------------------------------------
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "=== bootstrap tamamlandi: $(node --version) / $(caddy version) ==="
