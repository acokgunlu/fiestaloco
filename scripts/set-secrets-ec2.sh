#!/usr/bin/env bash
# =============================================================================
# FiestaLoco — sunucu sirlarini EC2'ye yaz
# =============================================================================
#   ./scripts/set-secrets-ec2.sh
#
# Yerel `.env.server` dosyasini okur ve sunucudaki /etc/fiestaloco.env dosyasini
# (0640, root:fiesta) yeniden yazar, ardindan servisi yeniden baslatir.
#
# .env.server .gitignore'da — git'e ASLA girmez.
# Bu dosyadaki degerler yalnizca sunucuda kalir; hicbiri frontend bundle'ina
# gitmez (VITE_ onekli degil).
#
# Beklenen icerik (.env.server):
#   SUPABASE_URL=https://lqpbfvzkfgxwatboente.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...
#   ALLOWED_ORIGINS=https://fiestaloco.site,https://www.fiestaloco.site,https://*.vercel.app
#   GEMINI_API_KEY=            # opsiyonel
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
source deploy/ec2/target.env

KEY="${FIESTA_SSH_KEY/#\~/$HOME}"
SSH_TARGET="${FIESTA_SSH_USER}@${FIESTA_HOST}"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

if [ ! -f .env.server ]; then
  cp .env.server.example .env.server
  chmod 600 .env.server
  echo "==> .env.server olusturuldu (.env.server.example'dan)."
fi

# --- Panodan anahtar alma ----------------------------------------------------
# `--from-clipboard`: Supabase (veya Vercel) panelinden service_role anahtarini
# kopyalayip tek komutla yerlestirmek icin. Anahtar terminale BASILMAZ.
if [ "${1:-}" = "--from-clipboard" ]; then
  KEY="$(pbpaste 2>/dev/null | tr -d '[:space:]')"
  if ! printf '%s' "$KEY" | grep -qE '^(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\..+|sb_secret_.+)$'; then
    echo "HATA: panoda gecerli bir Supabase service_role anahtari yok." >&2
    echo "      Supabase -> Project Settings -> API -> service_role (secret) -> kopyala," >&2
    echo "      sonra bu komutu tekrar calistirin." >&2
    exit 1
  fi
  # Satiri guvenle degistir (anahtar ekrana yazilmaz)
  python3 - "$KEY" <<'PY'
import pathlib, sys
key = sys.argv[1]
p = pathlib.Path('.env.server')
lines = p.read_text().split('\n')
out, found = [], False
for ln in lines:
    if ln.startswith('SUPABASE_SERVICE_ROLE_KEY='):
        out.append(f'SUPABASE_SERVICE_ROLE_KEY={key}')
        found = True
    else:
        out.append(ln)
if not found:
    out.append(f'SUPABASE_SERVICE_ROLE_KEY={key}')
p.write_text('\n'.join(out))
PY
  chmod 600 .env.server
  echo "==> Anahtar panodan .env.server'a yazildi (${#KEY} karakter)."
fi

# Yalnizca beklenen anahtarlari gecir; yorum ve bos satirlari at.
PAYLOAD=$(
  {
    echo "# Bu dosya scripts/set-secrets-ec2.sh tarafindan uretildi. Elle duzenlemeyin."
    echo "NODE_ENV=production"
    echo "PORT=3000"
    echo "SERVE_STATIC=false"
    grep -E '^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|ALLOWED_ORIGINS|GEMINI_API_KEY|SNAPSHOT_INTERVAL_MS|SNAPSHOT_MAX_AGE_MINUTES)=' .env.server \
      | sed 's/[[:space:]]*$//'
  }
)

echo "==> Aktarilan degiskenler:"
echo "$PAYLOAD" | grep -E '^[A-Z]' | while IFS='=' read -r k v; do
  case "$k" in
    *KEY*) printf '    %s=%s\n' "$k" "$([ -n "$v" ] && echo '***gizli***' || echo '(bos)')" ;;
    *)     printf '    %s=%s\n' "$k" "$v" ;;
  esac
done

printf '%s\n' "$PAYLOAD" | ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
  'sudo tee /etc/fiestaloco.env >/dev/null \
   && sudo chown root:fiesta /etc/fiestaloco.env \
   && sudo chmod 640 /etc/fiestaloco.env \
   && sudo systemctl restart fiestaloco 2>/dev/null || true'

echo "==> Yazildi. Supabase baglantisi dogrulaniyor..."
sleep 3
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'curl -fsS --max-time 5 http://127.0.0.1:3000/api/health' || {
  echo "UYARI: saglik kontrolu yanit vermedi (servis henuz deploy edilmemis olabilir)."
  exit 0
}
echo
