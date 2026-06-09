#!/usr/bin/env bash
# Деплой OhMyBudget на YC ВМ. Запуск с Mac из корня репо:
#   bash deploy/install-on-server.sh
set -euo pipefail

HOST="${DEPLOY_HOST:-ubuntu@62.84.127.30}"
IDENTITY_FILE="${DEPLOY_IDENTITY_FILE:-$HOME/.ssh/githubpersonal}"
SSH_OPTS=(-o IdentitiesOnly=yes -i "$IDENTITY_FILE")
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-tim.tagil@mail.ru}"

cd "$REPO_ROOT"

echo "==> 1/6 Bootstrap (docker, nginx, certbot)..."
ssh "${SSH_OPTS[@]}" "$HOST" 'sudo bash -s' < deploy/setup-server.sh

echo "==> 2/6 Clone repo on server..."
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<'REMOTE'
set -euo pipefail
if [[ ! -d /opt/ohmybudget/.git ]]; then
  git clone https://github.com/RomirosR/ohmybudget.git /opt/ohmybudget
fi
REMOTE

echo "==> 3/6 Sync prod files (ещё не в main)..."
rsync -avz \
  deploy/setup-server.sh \
  deploy/nginx/ohmybudget.conf \
  deploy/install-on-server.sh \
  docker-compose.prod.yml \
  .env.prod.example \
  "$HOST:/opt/ohmybudget/"

ssh "${SSH_OPTS[@]}" "$HOST" 'mkdir -p /opt/ohmybudget/deploy/nginx'
rsync -avz deploy/nginx/ohmybudget.conf "$HOST:/opt/ohmybudget/deploy/nginx/"

echo "==> 4/6 .env.prod + docker compose..."
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/ohmybudget
if [[ ! -f .env.prod ]]; then
  POSTGRES_PASSWORD=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -hex 32)
  printf 'POSTGRES_PASSWORD=%s\nJWT_SECRET=%s\n' "$POSTGRES_PASSWORD" "$JWT_SECRET" > .env.prod
  chmod 600 .env.prod
  echo "Created .env.prod"
fi
sudo docker compose --env-file .env.prod \
  -f docker-compose.yml -f docker-compose.prod.yml up -d --build
REMOTE

echo "==> 5/6 nginx reverse proxy..."
ssh "${SSH_OPTS[@]}" "$HOST" bash -s <<'REMOTE'
set -euo pipefail
sudo cp /opt/ohmybudget/deploy/nginx/ohmybudget.conf /etc/nginx/sites-available/ohmybudget.conf
sudo ln -sf /etc/nginx/sites-available/ohmybudget.conf /etc/nginx/sites-enabled/ohmybudget.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
REMOTE

echo "==> 6/6 Let's Encrypt (нужен DNS @ и www → IP ВМ)..."
if ssh "${SSH_OPTS[@]}" "$HOST" "curl -sf --max-time 5 http://127.0.0.1:8080/api/health"; then
  echo "App health OK"
else
  echo "WARN: /api/health not ready yet, certbot may fail"
fi

ssh "${SSH_OPTS[@]}" "$HOST" "sudo certbot --nginx \
  -d ohmybudget.by -d www.ohmybudget.by \
  --non-interactive --agree-tos -m ${CERTBOT_EMAIL} --redirect"

echo ""
echo "Done. Open https://ohmybudget.by"
