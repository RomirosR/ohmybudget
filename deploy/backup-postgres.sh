#!/usr/bin/env bash
# pg_dump с прод-ВМ. Запуск на сервере (cron: 0 3 * * * root /opt/ohmybudget/deploy/backup-postgres.sh)
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ohmybudget}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/ohmybudget}"
KEEP_DAYS="${KEEP_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="$BACKUP_DIR/ohmybudget-$STAMP.sql.gz"

cd "$COMPOSE_DIR"
docker compose --env-file .env.prod exec -T postgres \
  pg_dump -U ohmybudget ohmybudget | gzip > "$FILE"

find "$BACKUP_DIR" -name 'ohmybudget-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "Backup: $FILE"

# S3 upload — см. docs/14-hosting-security.md §бэкапы (позже)
