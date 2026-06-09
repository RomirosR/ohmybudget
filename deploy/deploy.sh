#!/usr/bin/env bash
# Обновление прод с сервера (git pull + docker compose). Вызывается из GitHub Actions.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ohmybudget}"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$APP_DIR"

if [[ ! -f .env.prod ]]; then
  echo "ERROR: .env.prod not found. Run install-on-server.sh first."
  exit 1
fi

echo "==> git pull ($BRANCH)..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "==> docker compose up --build..."
sudo docker compose --env-file .env.prod \
  -f docker-compose.yml \
  -f docker-compose.prod.yml up -d --build

echo "==> health check..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8080/api/health >/dev/null; then
    echo "OK: /api/health"
    exit 0
  fi
  sleep 2
done

echo "ERROR: health check failed"
sudo docker compose --env-file .env.prod \
  -f docker-compose.yml -f docker-compose.prod.yml ps
exit 1
