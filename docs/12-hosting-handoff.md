# Handoff — хостинг OhMyBudget на Yandex Cloud

> **Как использовать:** в новом чате прикрепи `@docs/12-hosting-handoff.md` (+ `@docs/09-session-handoff.md`,
> `@README.md`). MCP: `yandex-cloud-toolkit` и др. — см. §MCP ниже.

**Обновлено:** 2026-06-09

## Контекст проекта (кратко)

- **Репо:** https://github.com/RomirosR/ohmybudget
- **Ветка prod-кода:** `main` (input validation влита, PR #4)
- **Стек:** FastAPI + React/Vite + PostgreSQL (SQLite локально, PG в Docker)
- **Auth:** JWT, guest mode, register → сразу JWT (email verification **откатили**, см. ниже)
- **Домен:** `ohmybudget.by` (у пользователя уже есть)

## Что обсуждали в чате (важное)

### Email verification + Resend — ОТКАТИЛИ

- Пробовали фичу `feature/email-verification` (Resend API, confirm email перед login).
- Resend без своего домена: `onboarding@resend.dev` → письма **только** на email аккаунта Resend.
- SMTP (smtp.resend.com) **не снимает** это ограничение — нужен **верифицированный домен**.
- Ветка удалена, `main` без Resend. API key был в локальном `backend/.env` — **отозвать** в Resend Dashboard.
- **Вывод на будущее:** почта с `noreply@ohmybudget.by` → DNS (SPF/DKIM) + Postbox YC или Resend после верификации домена.

### Input validation — в main

- Журнал: `docs/10-input-validation.md`
- Backend: `schemas/fields.py`, FK checks, 39 pytest
- Frontend: `lib/validation.ts`, подсказки у числовых полей при ошибочном вводе

### Workflow агентов

- `.cursor/rules/git-and-docs-workflow.mdc` — коммитить по ходу работы (код + docs), PR по запросу.

---

## Yandex Cloud — текущее состояние аккаунта

| Ресурс | Значение |
|--------|----------|
| Cloud | `cloud-dedalusmoonlight` (`b1g4b1c73m6s194vncpc`) |
| Folder | `default` (`b1geapdle4ibgnd8pjks`) |
| Сеть | `default` (auto) |
| **ВМ** | `ohmybudget-prod` (`fhmr6igklt4doq0lkfa0`), IP **93.77.176.164** |
| Зоны | `ru-central1-a`, `b`, `d`, `e`, `k` (a/b — UP) |

MCP `clouds_list` / `folders_list` работают (OAuth подключён).

---

## MCP Yandex Cloud — что подключить

Репозиторий: https://github.com/yandex-cloud/mcp

| Сервер | `-s` | Зачем |
|--------|------|--------|
| **toolkit** | `toolkit` | ВМ, IP, VPC, S3, IAM, YDB |
| **containers** | `containers` | Container Registry, serverless containers |
| **docs** | `docs` | Поиск по доке YC (DNS, Postbox, PG) |
| **apigateway** | `apigateway` | Опционально; домен на API Gateway |

**Нет в MCP (делать в консоли / `yc`):** Cloud DNS (создание зоны), Managed PostgreSQL, Postbox, Certificate Manager, регистрация домена.

### Конфиг `~/.cursor/mcp.json` (фрагмент YC)

```json
"yandex-cloud-toolkit": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y", "@yandex-cloud/mcp", "-s", "toolkit",
    "-H", "Cloud-Id:b1g4b1c73m6s194vncpc",
    "-H", "Folder-Id:b1geapdle4ibgnd8pjks"
  ]
},
"yandex-cloud-containers": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@yandex-cloud/mcp", "-s", "containers", "-H", "Folder-Id:b1geapdle4ibgnd8pjks"]
},
"yandex-cloud-docs": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@yandex-cloud/mcp", "-s", "docs"]
}
```

Node.js 18+, при первом вызове — OAuth Yandex Cloud. Роль на folder: `editor` или выше.

---

## План хостинга `ohmybudget.by`

### Архитектура (целевая)

```
Пользователь → DNS (ohmybudget.by) → ВМ Ubuntu + статический IP
                                      ├── nginx :443 (Let's Encrypt)
                                      ├── frontend (static / docker)
                                      ├── backend FastAPI (/api)
                                      └── PostgreSQL (docker на ВМ)
```

Один домен: фронт `/`, API `/api` (как в dev). Отдельный `api.` subdomain не обязателен.

### Чеклист создания

| # | Задача | Кто/как |
|---|--------|---------|
| 1 | ВМ Ubuntu 22.04, 2 vCPU, 4 GB, ~30 GB, `ru-central1-a` | MCP toolkit |
| 2 | Статический внешний IP | при `instance_create` |
| 3 | Security group: 22 (лучше только IP пользователя), 80, 443 | консоль / MCP VPC |
| 4 | SSH public key в metadata ВМ | пользователь присылает ключ |
| 5 | DNS **A** `@` → IP ВМ; **A/CNAME** `www` | регистратор `.by` **или** Cloud DNS YC |
| 6 | Docker + compose на ВМ | SSH; есть `docker-compose.yml` в репо (dev-ориентирован) |
| 7 | Prod env: `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGINS=https://ohmybudget.by` | secrets на сервере |
| 8 | `alembic upgrade head` | backend container |
| 9 | certbot / HTTPS для `ohmybudget.by` + `www` | на ВМ после DNS |
| 10 | (опционально) S3 bucket бэкапов pg_dump | MCP toolkit |
| 11 | (позже) почта: MX/SPF/DKIM на `ohmybudget.by` | Postbox YC или Resend |

### DNS — два варианта

**A) DNS у регистратора** (быстрее): A `@` и `www` → IP ВМ.

**B) Cloud DNS YC:** создать зону `ohmybudget.by` → NS у регистратора → A-записи в YC.

### Prod docker

В репо есть `docker-compose.yml` (postgres + backend + frontend), но **нет prod-override** с nginx/SSL/JWT. Нужно:

- `docker-compose.prod.yml` или доработка compose
- nginx reverse proxy + certbot **или** Caddy
- не светить postgres наружу

### Ориентир стоимости YC

~1500–2500 ₽/мес ВМ + ~200 ₽ IP + S3 копейки.

---

## Не сделано / открыто

- [x] Создать ВМ + статический IP — см. [`docs/13-hosting-yc.md`](13-hosting-yc.md) §1
- [x] DNS `ohmybudget.by` → **62.84.127.30** — журнал §3
- [x] Prod compose + nginx — журнал §2
- [x] Деплой на сервер + certbot HTTPS — журнал §3
- [ ] Email verification (отложено; нужен домен в Postbox/Resend)
- [ ] E2E, Docker локально у разработчика

---

## Следующий шаг

1. Ужесточить security group (SSH с вашего IP).
2. (опционально) S3-бэкапы pg_dump.
3. (позже) почта noreply@ohmybudget.by.
