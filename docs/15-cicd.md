# Журнал — CI/CD (GitHub Actions)

**Обновлено:** 2026-06-09

## Схема

```
feature/* → локальные тесты → PR → merge в main
                                    ↓
                         GitHub Actions: pytest + frontend build
                                    ↓
                         SSH deploy → /opt/ohmybudget (git pull + docker compose)
```

Локальное тестирование — основное; CI на `main` — страховка перед деплоем.

**Умный деплой:** push в `main` с изменениями только в `docs/`, `README`, `.cursor/rules` — **не** пересобирает Docker на проде. Деплой при изменении: `backend/`, `frontend/`, `docker-compose*.yml`, `deploy/deploy.sh`, `deploy/nginx/**`. Ручной деплой: Actions → **Run workflow**.

## Шаг 1 — workflow + deploy.sh (коммит: 892f055)

**Дата:** 2026-06-09

**Что сделано:**

- `.github/workflows/ci-cd.yml` — `test` на PR и push; `deploy` только на push в `main`
- `deploy/deploy.sh` — на сервере: `git pull`, `docker compose … up -d --build`, health check
- Deploy-ключ `github-actions-ohmybudget` — публичная часть в `authorized_keys` на ВМ (приватная — только GitHub Secret)

**Почему так:** один домен, один сервер; без registry — pull + rebuild на месте.

**Секреты GitHub** (Settings → Secrets and variables → Actions):

| Secret | Значение |
|--------|----------|
| `DEPLOY_HOST` | `62.84.127.30` |
| `DEPLOY_SSH_KEY` | содержимое `deploy/.github-actions-deploy` (приватный ключ, **не коммитить**) |

Создать ключ локально (если ещё нет):

```bash
ssh-keygen -t ed25519 -f deploy/.github-actions-deploy -N "" -C "github-actions-ohmybudget"
# публичный ключ — на сервер в ~/.ssh/authorized_keys (уже сделано при настройке)
```

**Как проверить:**

```bash
# после merge в main и настройки Secrets:
# GitHub → Actions → CI/CD → зелёный deploy
curl -s https://ohmybudget.by/api/health
```

## Шаг 2 — первый автодеплой (коммит: ebf75ca)

**Дата:** 2026-06-09

**Что сделано:** PR #8 влит; GitHub Actions CI/CD — test + deploy success; сервер на `ebf75ca`.

**Как проверить:** https://github.com/RomirosR/ohmybudget/actions — workflow **CI/CD** green; `curl https://ohmybudget.by/api/health`

## Шаг 3 — path filter (деплой только при изменении кода) (коммит: e0c5f5d)

**Дата:** 2026-06-09

**Что сделано:** `dorny/paths-filter` в workflow — docs-only merge не триггерит deploy.

## Шаг 4 — flock в deploy.sh (коммит: pending)

**Дата:** 2026-06-09

**Что сделано:** `flock` на `.deploy.lock` — параллельный ручной deploy и GitHub Actions не ломают друг друга; health check 45×2 с.

**Почему так:** run #11 упал на deploy — одновременно шёл ручной `deploy.sh` и Actions после merge PR #12. Test был green.

## Открыто

- [x] GitHub Secrets `DEPLOY_HOST`, `DEPLOY_SSH_KEY`
- [ ] (опционально) required reviewers для environment `production`
