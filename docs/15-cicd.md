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

## Шаг 1 — workflow + deploy.sh (коммит: pending)

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

## Открыто

- [ ] Добавить `DEPLOY_HOST` и `DEPLOY_SSH_KEY` в GitHub Secrets (вручную)
- [ ] (опционально) required reviewers для environment `production`
