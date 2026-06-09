#!/usr/bin/env bash
# Применить hardening на прод-ВМ с Mac (из корня репо).
#   cp deploy/security.env.example deploy/security.env   # ваш IP/32
#   bash deploy/apply-security.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-ubuntu@62.84.127.30}"
IDENTITY_FILE="${DEPLOY_IDENTITY_FILE:-$HOME/.ssh/githubpersonal}"
SSH_OPTS=(-o IdentitiesOnly=yes -i "$IDENTITY_FILE")
ENV_FILE="${REPO_ROOT}/deploy/security.env"

cd "$REPO_ROOT"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

if [[ -z "${ADMIN_SSH_CIDR:-}" ]]; then
  echo "Задайте ADMIN_SSH_CIDR в deploy/security.env (см. security.env.example)"
  echo "Текущий IP: curl -4 ifconfig.me"
  exit 1
fi

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
  "sudo ADMIN_SSH_CIDR=${ADMIN_SSH_CIDR} HARDEN_SNIPPET_SRC=/opt/ohmybudget/deploy/nginx/snippets/security-headers.conf bash /opt/ohmybudget/deploy/harden-server.sh"

echo "Проверка: curl -sI https://ohmybudget.by/ | head -5"
