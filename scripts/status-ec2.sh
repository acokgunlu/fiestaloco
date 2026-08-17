#!/usr/bin/env bash
# =============================================================================
# FiestaLoco — sunucu durumu tek bakista
# =============================================================================
#   ./scripts/status-ec2.sh          # ozet
#   ./scripts/status-ec2.sh logs     # canli log (Ctrl-C ile cik)
#   ./scripts/status-ec2.sh restart  # servisi yeniden baslat
#   ./scripts/status-ec2.sh ssh      # kutuya gir
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
source deploy/ec2/target.env

KEY="${FIESTA_SSH_KEY/#\~/$HOME}"
SSH_TARGET="${FIESTA_SSH_USER}@${FIESTA_HOST}"
SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

case "${1:-status}" in
  logs)
    exec ssh -t "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo journalctl -u fiestaloco -f -n 60'
    ;;
  restart)
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'sudo systemctl restart fiestaloco && sleep 2 && systemctl is-active fiestaloco'
    exit $?
    ;;
  ssh)
    exec ssh -t "${SSH_OPTS[@]}" "$SSH_TARGET"
    ;;
esac

printf '\n\033[1;36m=== FiestaLoco sunucu durumu ===\033[0m\n\n'

ssh "${SSH_OPTS[@]}" "$SSH_TARGET" 'bash -s' <<'REMOTE'
printf 'fiestaloco : %s (%s)\n' \
  "$(systemctl is-active fiestaloco)" \
  "$(systemctl show fiestaloco -p ActiveEnterTimestamp --value | cut -d' ' -f2-3)"
printf 'caddy      : %s\n' "$(systemctl is-active caddy)"
printf 'yeniden bs.: %s kez\n' "$(systemctl show fiestaloco -p NRestarts --value)"
printf 'bellek     : %s\n' "$(free -h | awk '/^Mem:/ {print $3" / "$2" kullanimda"}')"
printf 'swap       : %s\n' "$(free -h | awk '/^Swap:/ {print $3" / "$2}')"
printf 'disk       : %s\n' "$(df -h / | awk 'NR==2 {print $3" / "$2" (%"$5")"}' | tr -d '%%')"
printf 'yuk        : %s\n' "$(uptime | sed 's/.*load average: //')"
CRT=$(sudo find /var/lib/caddy -name '*.crt' -path '*certificates*' 2>/dev/null | head -1)
if [ -n "$CRT" ]; then
  printf 'sertifika  : %s — bitis %s\n' \
    "$(basename "$CRT" .crt)" \
    "$(sudo openssl x509 -noout -enddate -in "$CRT" | cut -d= -f2)"
else
  printf 'sertifika  : yok (DNS hazir mi?)\n'
fi
REMOTE

printf '\n\033[1;36m--- /api/health (public) ---\033[0m\n'
curl -fsS --max-time 8 "https://${FIESTA_DOMAIN}/api/health" 2>/dev/null \
  | python3 -m json.tool 2>/dev/null \
  || echo "UYARI: https://${FIESTA_DOMAIN} yanit vermedi (DNS veya sertifika?)"
echo
