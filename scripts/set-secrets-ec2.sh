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
  cat >&2 <<'EOF'
HATA: .env.server bulunamadi.

Olusturmak icin:
  cp .env.server.example .env.server
  # sonra Supabase panelinden service_role anahtarini yapistirin:
  #   Project Settings -> API -> Project API keys -> service_role (secret)
EOF
  exit 1
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
