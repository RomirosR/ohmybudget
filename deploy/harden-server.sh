#!/usr/bin/env bash
# UFW + fail2ban + nginx security headers на прод-ВМ.
# Запуск на сервере: sudo bash harden-server.sh
# Или с Mac: bash deploy/apply-security.sh
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Запустите от root: sudo bash harden-server.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ufw fail2ban

echo "==> UFW: 80/443/22 для всех (SSH без привязки к IP; защита — ключи + fail2ban)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp comment 'http public'
ufw allow 443/tcp comment 'https public'
ufw allow 22/tcp comment 'ssh key-only'
ufw --force enable
ufw status verbose

echo "==> fail2ban (sshd)"
install -d -m 0755 /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
findtime = 10m
EOF
systemctl enable --now fail2ban

SNIPPET_SRC="${HARDEN_SNIPPET_SRC:-/opt/ohmybudget/deploy/nginx/snippets/security-headers.conf}"
SNIPPET_DST=/etc/nginx/snippets/security-headers.conf
if [[ -f "$SNIPPET_SRC" ]]; then
  echo "==> nginx security headers"
  install -d -m 0755 /etc/nginx/snippets
  cp "$SNIPPET_SRC" "$SNIPPET_DST"
  SITE=/etc/nginx/sites-available/ohmybudget.conf
  if [[ -f "$SITE" ]] && ! grep -q 'security-headers.conf' "$SITE"; then
    sed -i '/listen 443 ssl/a \    include /etc/nginx/snippets/security-headers.conf;' "$SITE"
    nginx -t
    systemctl reload nginx
  fi
fi

echo "Готово. Сайт и SSH (:22) открыты; доступ по SSH-ключам, fail2ban против перебора."
