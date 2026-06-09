# Журнал — хостинг на Yandex Cloud (ohmybudget.by)

**Обновлено:** 2026-06-09

Handoff и чеклист: [`docs/12-hosting-handoff.md`](12-hosting-handoff.md).

## Шаг 1 — ВМ + статический IP (коммит: pending)

**Дата:** 2026-06-09

**Что сделано:**

- Создана ВМ `ohmybudget-prod` в `ru-central1-a` через MCP `yandex-cloud-toolkit`:
  - Ubuntu 22.04 LTS (`ubuntu-2204-lts`)
  - 2 vCPU, 4 GB RAM, диск 30 GB (`network-ssd`)
  - Первый IP: `93.77.176.164` (сменился после stop/start; см. шаг 1b)
- ID первой ВМ: `fhmr6igklt4doq0lkfa0` (удалена)
- Сеть: `default`, subnet `default-ru-central1-a`
- Security group `default-sg`: сейчас **весь ingress открыт** (0.0.0.0/0) — позже сузить SSH до IP пользователя

**Почему так:** один сервер с Docker — минимальная стоимость и простой деплой для MVP; TLS на хостовом nginx, приложение слушает только localhost:8080.

## Шаг 1b — Пересоздание ВМ (SSH-ключ) (коммит: pending)

**Дата:** 2026-06-09

**Что сделано:**

- Первая ВМ: MCP записал metadata как `key`/`value` вместо `ssh-keys` → cloud-init не создал `authorized_keys`.
- Пересоздана ВМ `ohmybudget-prod` с корректной metadata `ssh-keys` + `user-data`.
- ID: `fhmfi3a264aq8vpeurgg`, IP: **62.84.127.30** (статический).

**Как проверить:**

```bash
ssh -i ~/.ssh/githubpersonal -o IdentitiesOnly=yes ubuntu@62.84.127.30
```

## Шаг 2 — Prod compose + nginx (коммит: 8fa5e6a)

**Дата:** 2026-06-09

**Что сделано:**

- `docker-compose.prod.yml` — без публикации postgres/backend, frontend на `127.0.0.1:8080`
- `.env.prod.example` — плейсхолдеры `POSTGRES_PASSWORD`, `JWT_SECRET`
- `deploy/nginx/ohmybudget.conf` — reverse proxy + ACME webroot
- `deploy/setup-server.sh` — Docker, nginx, certbot на Ubuntu
- `deploy/install-on-server.sh` — деплой с Mac (`DEPLOY_IDENTITY_FILE` → `~/.ssh/githubpersonal`)

## Шаг 3 — Деплой на прод (коммит: pending)

**Дата:** 2026-06-09

**Что сделано:**

- DNS: A `@` и `www` → `62.84.127.30` (регистратор `.by`)
- `bash deploy/install-on-server.sh` — clone, compose, nginx, certbot
- HTTPS: Let's Encrypt до 2026-09-07
- Секреты `.env.prod` сгенерированы на сервере (`openssl rand`), **не в git**

**Как проверить:**

```bash
curl -s https://ohmybudget.by/api/health   # {"status":"ok"}
```

## Открыто

- [x] DNS и деплой на ВМ
- [ ] Ужесточить security group (SSH только с IP пользователя)
- [ ] (опционально) S3-бэкапы pg_dump
- [ ] (позже) почта noreply@ohmybudget.by
