# Handoff — хостинг OhMyBudget на Yandex Cloud

> **Как использовать:** `@docs/12-hosting-handoff.md` + `@docs/09-session-handoff.md` + `@README.md`.
> MCP: `yandex-cloud-toolkit`. Журналы: `docs/13-hosting-yc.md`, `docs/14-hosting-security.md`, `docs/15-cicd.md`.

**Обновлено:** 2026-06-09

## Прод сейчас

- **Сайт:** https://ohmybudget.by (Let's Encrypt, nginx на хосте, app в Docker)
- **Health:** `curl -s https://ohmybudget.by/api/health` → `{"status":"ok"}`
- **Деплой:** merge в `main` с изменением кода → GitHub Actions → `deploy/deploy.sh` на ВМ

## Yandex Cloud

| Ресурс | Значение |
|--------|----------|
| Cloud | `cloud-dedalusmoonlight` (`b1g4b1c73m6s194vncpc`) |
| Folder | `default` (`b1geapdle4ibgnd8pjks`) |
| ВМ | `ohmybudget-prod` (`fhmfi3a264aq8vpeurgg`) |
| IP | **62.84.127.30** (статический, закрепить в консоли если ещё не) |
| Зона | `ru-central1-a` |
| Сеть | `default` |

Первая ВМ (`fhmr6igklt4doq0lkfa0`) удалена — была проблема с SSH metadata через MCP.

## SSH

- Пользователь: `ubuntu`, ключ `~/.ssh/githubpersonal` (`IdentitiesOnly=yes`)
- GitHub Actions: `deploy/.github-actions-deploy` → Secret `DEPLOY_SSH_KEY`
- **Без whitelist IP** — UFW открывает 22 для всех; защита: ключи + fail2ban
- Доп. админ: добавить ключ в metadata ВМ `ssh-keys` (строка `ubuntu:ssh-ed25519 …` на каждую строку)

## Архитектура на ВМ

```
Интернет → nginx :443 (TLS) → 127.0.0.1:8080 (frontend container)
                                    ↓ /api
                              backend container → postgres (только internal)
```

Секреты: `/opt/ohmybudget/.env.prod` (`POSTGRES_PASSWORD`, `JWT_SECRET`).

## Скрипты deploy/

| Скрипт | Когда |
|--------|--------|
| `install-on-server.sh` | Первичная установка (с Mac) |
| `deploy.sh` | Обновление (CI/CD или вручную на сервере) |
| `apply-security.sh` | UFW + fail2ban + nginx headers |
| `backup-postgres.sh` | pg_dump (cron 03:00 UTC) |
| `yc/security-group.md` | Опционально SG в консоли |

## MCP

| Сервер | Зачем |
|--------|--------|
| `yandex-cloud-toolkit` | ВМ, сети, S3, … |
| `yandex-cloud-containers` | Registry (не используем пока) |
| `yandex-cloud-docs` | Дока YC |

**MCP metadata при `instance_create`:** передавать `{"ssh-keys": "ubuntu:…"}` напрямую, не `{key, value}`.

## Открыто

- [ ] YC security group (опционально)
- [ ] S3 offsite backups
- [ ] Почта noreply@ohmybudget.by

## Email verification — откатана

Resend без верифицированного домена бесполезен. Ветка удалена. См. историю в старом §чата в этом файле / `docs/09`.
