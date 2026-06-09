# Журнал — безопасность прод-хостинга

**Обновлено:** 2026-06-09

См. также: [`docs/13-hosting-yc.md`](13-hosting-yc.md), [`docs/12-hosting-handoff.md`](12-hosting-handoff.md).

## Шаг 1 — UFW, fail2ban, nginx headers (коммит: 8564aed)

**Дата:** 2026-06-09

**Что сделано:**

- `deploy/harden-server.sh` — UFW: **80/443 для всех**, SSH (22) только с `ADMIN_SSH_CIDR`
- `deploy/apply-security.sh` — применение с Mac; секреты в `deploy/security.env` (gitignore)
- `deploy/nginx/snippets/security-headers.conf` — HSTS, X-Frame-Options, nosniff
- fail2ban для sshd
- `deploy/yc/security-group.md` — инструкция SG в YC (MCP не поддерживает)

**Почему так:** сайт остаётся публичным; сужаем только админский SSH. Два слоя: UFW на ВМ + (опционально) SG в YC.

**Как проверить:**

```bash
cp deploy/security.env.example deploy/security.env   # ваш IP/32
bash deploy/apply-security.sh
curl -sI https://ohmybudget.by/ | grep -i strict-transport
ssh -i ~/.ssh/githubpersonal ubuntu@62.84.127.30    # с вашего IP — OK
```

## Шаг 2 — pg_dump бэкапы (коммит: 8564aed)

**Дата:** 2026-06-09

**Что сделано:**

- `deploy/backup-postgres.sh` — локальный дамп в `/var/backups/ohmybudget`, ротация 7 дней
- S3 upload — **не сделано** (нужен bucket + service account)

**Как проверить (на сервере):**

```bash
sudo bash /opt/ohmybudget/deploy/backup-postgres.sh
ls -la /var/backups/ohmybudget/
```

## Открыто

- [ ] YC security group `ohmybudget-prod-sg` в консоли (см. `deploy/yc/security-group.md`)
- [x] Cron для `backup-postgres.sh` на сервере (`/etc/cron.d/ohmybudget-backup`, 03:00 UTC)
- [ ] S3-бэкапы
- [ ] (позже) почта noreply@ohmybudget.by
