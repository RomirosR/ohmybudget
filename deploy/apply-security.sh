#!/usr/bin/env bash
# Применить hardening на прод-ВМ с Mac (из корня репо).
#   bash deploy/apply-security.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-ubuntu@62.84.127.30}"
IDENTITY_FILE="${DEPLOY_IDENTITY_FILE:-$HOME/.ssh/githubpersonal}"
SSH_OPTS=(-o IdentitiesOnly=yes -i "$IDENTITY_FILE")

cd "$REPO_ROOT"

echo "==> Sync security files..."
ssh "${SSH_OPTS[@]}" "$HOST" 'mkdir -p /opt/ohmybudget/deploy/nginx/snippets'
rsync -avz \
  deploy/harden-server.sh \
  deploy/nginx/snippets/security-headers.conf \
  "$HOST:/opt/ohmybudget/deploy/"
rsync -avz deploy/nginx/snippets/security-headers.conf \
  "$HOST:/opt/ohmybudget/deploy/nginx/snippets/"

echo "==> Harden (UFW, fail2ban, nginx headers)..."
ssh "${SSH_OPTS[@]}" "$HOST" \
  "sudo HARDEN_SNIPPET_SRC=/opt/ohmybudget/deploy/nginx/snippets/security-headers.conf bash /opt/ohmybudget/deploy/harden-server.sh"

echo "Проверка: curl -sI https://ohmybudget.by/ | head -5"
