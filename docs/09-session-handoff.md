# Handoff — контекст для нового чата

> **Как использовать:** в новом чате прикрепи `@docs/09-session-handoff.md` (+ `@README.md`, при хостинге —
> `@docs/12-hosting-handoff.md`). Правила агентов: `.cursor/rules/git-and-docs-workflow.mdc` (auto).

**Обновлено:** 2026-06-09 (конец сессии: прод + CI/CD + security)

## Текущее состояние

- **Репо:** https://github.com/RomirosR/ohmybudget
- **Ветка:** `main` (= `origin/main`), последний merge: `f888fb8` (smart CI/CD + workflow rules, PR #10)
- **Прод:** https://ohmybudget.by — работает, HTTPS, CI/CD деплоит при изменении кода

## Что в main (фичи)

| Фича | Журнал / где |
|------|----------------|
| PostgreSQL dual-DB | `docs/06-postgres-migration.md` |
| JWT + guest mode | `docs/07-auth.md`, `docs/08-guest-mode.md` |
| Input validation | `docs/10-input-validation.md` |
| **Хостинг YC** | `docs/13-hosting-yc.md`, handoff `docs/12-hosting-handoff.md` |
| **Security прод** | `docs/14-hosting-security.md` |
| **CI/CD** | `docs/15-cicd.md`, `.github/workflows/ci-cd.yml` |
| **Workflow агентов** | `.cursor/rules/git-and-docs-workflow.mdc` |

## Прод (кратко)

| | |
|---|---|
| Домен | `ohmybudget.by` (+ `www`), DNS у регистратора `.by` |
| ВМ | `ohmybudget-prod` (`fhmfi3a264aq8vpeurgg`), IP **62.84.127.30** |
| YC | cloud `b1g4b1c73m6s194vncpc`, folder `b1geapdle4ibgnd8pjks` |
| Код на сервере | `/opt/ohmybudget`, Docker compose prod |
| Секреты | `.env.prod` на сервере (не в git), GitHub Secrets `DEPLOY_HOST`, `DEPLOY_SSH_KEY` |

**SSH (пользователь):** `ssh -i ~/.ssh/githubpersonal ubuntu@62.84.127.30`  
**SSH (Actions):** ключ `deploy/.github-actions-deploy` (локально, gitignore) → Secret `DEPLOY_SSH_KEY`

## CI/CD

```
feature/* → локально pytest + npm run build → PR → merge (по согласию автора)
                                                      ↓
                                    push main + изменён код → test → deploy
                                    push main только docs → deploy пропускается
```

Ручной деплой: GitHub → Actions → **CI/CD** → Run workflow.

## Локальная разработка

```bash
cd backend && source .venv/bin/activate && alembic upgrade head && uvicorn app.main:app --reload
cd frontend && npm run dev
cd backend && pytest
cd frontend && npm run build
```

## Workflow агентов (суть)

1. `feature/<имя>` от `main`
2. Атомарные коммиты + docs; **никогда** секреты в git
3. PR в `main`; **merge только по явному запросу** пользователя
4. Коммиты — по ходу или по запросу (см. правила в `.cursor/rules`)

## MCP (Yandex Cloud)

Подключены: `yandex-cloud-toolkit`, `containers`, `docs`. **Нет в MCP:** security groups create, Cloud DNS, Postbox.

## Не сделано / открыто

- [ ] YC security group в консоли (опционально; UFW на ВМ уже есть) — `deploy/yc/security-group.md`
- [ ] S3-бэкапы pg_dump (локальный cron есть: `/etc/cron.d/ohmybudget-backup`)
- [ ] **Postbox в консоли YC** — DKIM/SPF для `noreply@ohmybudget.by`, ключи в `.env.prod` (код в `feature/email-verification`, журнал `docs/16-email-verification.md`)
- [ ] E2E из `docs/04-infra-run.md`

## Ключевые файлы

```
backend/app/api/deps/auth.py
deploy/deploy.sh              # прод-обновление на сервере
deploy/install-on-server.sh   # первичная установка
deploy/apply-security.sh      # UFW + fail2ban
.github/workflows/ci-cd.yml
.cursor/rules/git-and-docs-workflow.mdc
```

## Следующие задачи (на выбор пользователя)

Фичи приложения, S3-бэкапы, почта, E2E, YC SG — уточнить у пользователя.
