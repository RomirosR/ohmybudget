#!/usr/bin/env bash
# Первичная настройка Ubuntu 22.04 на YC ВМ для OhMyBudget.
# Запуск: bash deploy/setup-server.sh
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Запустите от root: sudo bash deploy/setup-server.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

systemctl enable --now docker nginx
usermod -aG docker ubuntu

mkdir -p /var/www/certbot /opt/ohmybudget
chown -R ubuntu:ubuntu /opt/ohmybudget

echo ""
echo "Дальше (от пользователя ubuntu):"
echo "  cd /opt/ohmybudget && git clone https://github.com/RomirosR/ohmybudget.git ."
echo "  cp .env.prod.example .env.prod   # задайте POSTGRES_PASSWORD и JWT_SECRET"
echo "  docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
echo "  sudo cp deploy/nginx/ohmybudget.conf /etc/nginx/sites-available/"
echo "  sudo ln -sf /etc/nginx/sites-available/ohmybudget.conf /etc/nginx/sites-enabled/"
echo "  sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx"
echo "  sudo certbot --nginx -d ohmybudget.by -d www.ohmybudget.by"
