#!/usr/bin/env bash
# Удаляет всех пользователей и их данные (планы, операции, …). Справочники сохраняются.
# Запуск на прод-ВМ из /opt/ohmybudget:
#   sudo bash deploy/wipe-user-data.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/ohmybudget}"
cd "$APP_DIR"

if [[ ! -f .env.prod ]]; then
  echo "ERROR: .env.prod not found"
  exit 1
fi

echo "==> Wiping all user accounts and budget data..."
sudo docker compose --env-file .env.prod \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  exec -T postgres psql -U ohmybudget -d ohmybudget <<'SQL'
TRUNCATE TABLE
  operations,
  monthly_plans,
  month_settings,
  assets,
  investments,
  users
RESTART IDENTITY CASCADE;
SQL

echo "OK: users and related data removed. Lookups unchanged."
