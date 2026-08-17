#!/usr/bin/env bash
# =============================================================================
# FiestaLoco — sunucunun alan adini ayarla (Caddy + otomatik sertifika)
# =============================================================================
#   ./scripts/set-domain-ec2.sh                    # target.env'deki FIESTA_DOMAIN
#   ./scripts/set-domain-ec2.sh api.baskasey.com   # gecici olarak baska bir ad
#
# Yaptigi: Caddyfile sablonunu doldurup sunucuya koyar, Caddy'yi yeniden yukler.
# Caddy sertifikayi Let's Encrypt'ten kendisi alir ve 60 gunde bir yeniler.
#
# ON KOSUL: alan adinin A kaydi bu sunucunun IP'sine bakmali. Betik bunu
# calistirmadan once kendisi dogruluyor.
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
source deploy/ec2/target.env

DOMAIN="${1:-$FIESTA_DOMAIN}"
KEY="${FIESTA_SSH_KEY/#\~/$HOME}"
SSH_TARGET="${FIESTA_SSH_USER}@${FIESTA_HOST}"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# --- DNS on kontrolu ----------------------------------------------------------
say "DNS kontrolu: $DOMAIN"
RESOLVED=$(dig +short "$DOMAIN" A @1.1.1.1 | tail -1)
if [ -z "$RESOLVED" ]; then
  cat >&2 <<EOF

HATA: $DOMAIN cozumlenmiyor — A kaydi henuz yok (veya yayilmadi).

Vercel panelinde:  Domains -> fiestaloco.site -> DNS Records -> Add
    Type  A
    Name  ${DOMAIN%%.*}
    Value $FIESTA_HOST

Kayit yayilinca bu betigi tekrar calistirin. Caddy sertifikayi ancak DNS
dogru gosterdiginde alabilir (Let's Encrypt HTTP-01 dogrulamasi).
EOF
  exit 1
fi
if [ "$RESOLVED" != "$FIESTA_HOST" ]; then
  echo "HATA: $DOMAIN -> $RESOLVED, beklenen $FIESTA_HOST" >&2
  echo "A kaydini duzeltin veya DNS yayilmasini bekleyin." >&2
  exit 1
fi
echo "    $DOMAIN -> $RESOLVED  ✓"

# --- Caddyfile ----------------------------------------------------------------
say "Caddy yapilandiriliyor"
sed "s|__DOMAIN__|$DOMAIN|g" deploy/ec2/Caddyfile \
  | ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo tee /etc/caddy/Caddyfile >/dev/null'

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'bash -euo pipefail -s' <<'REMOTE'
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy || sudo systemctl restart caddy
sudo systemctl enable caddy >/dev/null 2>&1
REMOTE

# --- Sertifika bekle ----------------------------------------------------------
say "Let's Encrypt sertifikasi bekleniyor (ilk seferde ~15 sn)"
for i in $(seq 1 24); do
  if curl -fsS --max-time 5 "https://$DOMAIN/api/health" >/tmp/fiesta-health.json 2>/dev/null; then
    echo "    sertifika hazir ✓"
    echo
    cat /tmp/fiesta-health.json
    echo
    say "Hazir:  https://$DOMAIN"
    echo "   Simdi Vercel'de  VITE_SERVER_URL=https://$DOMAIN  yapip yeniden deploy edin."
    exit 0
  fi
  sleep 5
done

echo "HATA: HTTPS 2 dakikada acilmadi. Caddy loglari:" >&2
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo journalctl -u caddy -n 40 --no-pager'
exit 1
