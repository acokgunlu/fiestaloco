#!/usr/bin/env bash
# =============================================================================
# FiestaLoco — oyun sunucusunu EC2'ye deploy et
# =============================================================================
#   ./scripts/deploy-ec2.sh
#
# Ne yapar:
#   1. Sunucu paketini YERELDE derler (esbuild, ~1 sn) — 1 GB'lik kutuyu yormaz
#   2. dist-server/ + package.json'i rsync ile atar
#   3. Bagimliliklar degistiyse sunucuda `npm ci --omit=dev` calistirir
#   4. systemd unit'ini gunceller ve servisi yeniden baslatir
#   5. /api/health'i dogrular — basarisizsa cikis kodu 1
#
# Deploy sirasinda sunucu odalarin snapshot'ini Supabase'e yazar ve
# istemcilere `server:restarting` gonderir; telefonlar ~1.5 sn'de geri baglanir.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=../deploy/ec2/target.env
source deploy/ec2/target.env

KEY="${FIESTA_SSH_KEY/#\~/$HOME}"
SSH_TARGET="${FIESTA_SSH_USER}@${FIESTA_HOST}"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
REMOTE_APP=/opt/fiestaloco/app

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# --- SSH erisimini garanti et ---------------------------------------------
# 22. port yalnizca gecerli ev IP'sine acik. Ev IP'si degistiginde deploy
# "Operation timed out" ile duser; bu adim guvenlik grubunu sessizce hizalar.
ensure_ssh_access() {
  local myip sg="${FIESTA_SG_ID:-sg-0dcb73d7aa0476bf5}"
  myip="$(curl -fsS --max-time 8 https://checkip.amazonaws.com 2>/dev/null | tr -d '[:space:]')" || return 0
  [ -n "$myip" ] || return 0

  if aws ec2 describe-security-groups --region "${FIESTA_REGION:-eu-central-1}" --group-ids "$sg" \
       --query "SecurityGroups[0].IpPermissions[?FromPort==\`22\`].IpRanges[].CidrIp" --output text 2>/dev/null \
       | tr '\t' '\n' | grep -qx "$myip/32"; then
    return 0
  fi

  say "SSH kurali guncelleniyor (IP degismis: $myip)"
  aws ec2 authorize-security-group-ingress --region "${FIESTA_REGION:-eu-central-1}" --group-id "$sg" \
    --ip-permissions "IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=${myip}/32,Description='deploy-ec2.sh otomatik'}]" \
    >/dev/null 2>&1 || true
}
ensure_ssh_access

# --- 1. Yerel derleme ---------------------------------------------------------
say "Sunucu paketi derleniyor (yerel)"
npm run build:server
test -f dist-server/server.cjs || { echo "HATA: dist-server/server.cjs olusmadi"; exit 1; }
printf '   %s\n' "$(du -h dist-server/server.cjs | cut -f1) — dist-server/server.cjs"

# --- 2. Dosyalari gonder ------------------------------------------------------
say "Dosyalar ${FIESTA_HOST} adresine gonderiliyor"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "sudo mkdir -p $REMOTE_APP && sudo chown -R fiesta:fiesta /opt/fiestaloco"

# macOS'taki openrsync --chmod desteklemiyor; izinler karsi tarafta duzeltiliyor.
RSYNC_OPTS=(-az -e "ssh ${SSH_OPTS[*]}" --rsync-path="sudo rsync")

rsync "${RSYNC_OPTS[@]}" --delete dist-server/ "$SSH_TARGET:$REMOTE_APP/dist-server/"
rsync "${RSYNC_OPTS[@]}" package.json package-lock.json "$SSH_TARGET:$REMOTE_APP/"
rsync "${RSYNC_OPTS[@]}" deploy/ec2/fiestaloco.service "$SSH_TARGET:/tmp/fiestaloco.service"

# --- 3-4. Sunucu tarafi -------------------------------------------------------
say "Bagimliliklar + servis"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'bash -euo pipefail -s' <<'REMOTE'
APP=/opt/fiestaloco/app
# Yerel repo 0600 izinleriyle geliyor — sunucuda okunabilir hale getir.
sudo chown -R fiesta:fiesta /opt/fiestaloco
sudo chmod -R u=rwX,g=rX,o=rX $APP/dist-server $APP/package.json $APP/package-lock.json

# package-lock degismediyse npm ci'yi atla (deploy'u 60 sn -> 5 sn'ye indirir)
NEW_HASH=$(sudo sha256sum $APP/package-lock.json | cut -d' ' -f1)
OLD_HASH=$(sudo cat /opt/fiestaloco/.deps-hash 2>/dev/null || echo none)
if [ "$NEW_HASH" != "$OLD_HASH" ]; then
  echo "   bagimliliklar degismis, npm ci calisiyor..."
  sudo -u fiesta bash -lc "cd $APP && npm ci --omit=dev --no-audit --no-fund"
  echo "$NEW_HASH" | sudo tee /opt/fiestaloco/.deps-hash >/dev/null
else
  echo "   bagimliliklar ayni, npm ci atlandi"
fi

sudo install -m 644 /tmp/fiestaloco.service /etc/systemd/system/fiestaloco.service
sudo rm -f /tmp/fiestaloco.service
sudo systemctl daemon-reload
sudo systemctl enable fiestaloco >/dev/null 2>&1
sudo systemctl restart fiestaloco
REMOTE

# --- 5. Dogrulama -------------------------------------------------------------
say "Saglik kontrolu"
for i in $(seq 1 20); do
  if ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'curl -fsS --max-time 3 http://127.0.0.1:3000/api/health' 2>/dev/null; then
    echo
    say "Deploy tamam."
    echo "   Yerel   : http://127.0.0.1:3000/api/health  (sunucu icinde)"
    echo "   Public  : https://${FIESTA_DOMAIN}/api/health"
    exit 0
  fi
  sleep 1.5
done

echo
echo "HATA: servis 30 sn icinde saglikli yanit vermedi. Son loglar:"
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo journalctl -u fiestaloco -n 40 --no-pager'
exit 1
