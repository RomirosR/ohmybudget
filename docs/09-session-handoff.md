# Handoff — контекст для нового чата

> **Как использовать:** в новом чате Cursor прикрепи `@docs/09-session-handoff.md` (+ при необходимости
> `@README.md`, `@docs/00-overview.md`). Правила агентов подхватываются автоматически из
> `.cursor/rules/git-and-docs-workflow.mdc`.

**Обновлено:** 2026-06-09 (prod deploy)

## Текущее состояние репозитория

- **Ветка:** `main` (= `origin/main`)
- **Последний merge:** `060cae6` — input validation (PR #4); правила агентов (PR #3)
- **Репо:** https://github.com/RomirosR/ohmybudget

## Что уже в main

| Фича | Суть | Журнал |
|------|------|--------|
| PostgreSQL dual-DB | SQLite локально/pytest, PG в Docker | `docs/06-postgres-migration.md` |
| JWT multi-user | register/login/me, `user_id` на сущностях | `docs/07-auth.md` |
| Guest mode | все вкладки без входа; сохранение после регистрации | `docs/08-guest-mode.md` |
| Input validation | Pydantic + формы, подсказки у числовых полей | `docs/10-input-validation.md` |
| Agent workflow | ветка/коммиты/docs/PR | `.cursor/rules/git-and-docs-workflow.mdc` |

## Архитектура (кратко)

- **Backend:** FastAPI, `api/deps/auth.py` — `get_current_user` (запись), `get_optional_user` (гостевой GET)
- **Frontend:** `AuthContext` + `runWithAuth` + `AuthModal`; guarded mutations на CRUD-экранах
- **БД локально:** `backend/ohmybudget.db` (SQLite)
- **Env:** `backend/.env.example` (`DATABASE_URL`, `JWT_SECRET`)

## Запуск (локально, без Docker)

```bash
cd backend && source .venv/bin/activate && alembic upgrade head && uvicorn app.main:app --reload
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- API/Swagger: http://127.0.0.1:8000/docs

После обновления с версии без auth: `rm backend/ohmybudget.db && alembic upgrade head`

## Тесты

```bash
cd backend && pytest          # 39 тестов
cd frontend && npm run build
```

## Workflow для новых фич

1. `git checkout main && git pull`
2. `git checkout -b feature/<имя>`
3. Атомарные коммиты + документация (журнал в `docs/` или обновление слойных docs); коммитить по ходу работы
4. PR в `main`, merge по запросу пользователя

## Ключевые файлы

```
backend/app/api/deps/auth.py      # get_current_user, get_optional_user
backend/app/core/security.py      # bcrypt + JWT
frontend/src/context/AuthContext.tsx
frontend/src/components/AuthModal.tsx
frontend/src/hooks/useGuardedMutation.ts
```

## Не сделано / открыто

- [ ] E2E-прогон из `docs/04-infra-run.md`
- [ ] Docker Compose + PostgreSQL не проверялся на машине разработчика (Docker не установлен)
- [ ] `docs/05-todo.md` §9 — отметить PR как влитый (можно обновить при следующей задаче)

- `docs/11-email-verification.md` — **не актуален** (фича откатана; черновик не в main).
- `docs/12-hosting-handoff.md` — **handoff хостинга YC + домен ohmybudget.by**.

## Следующая задача

Хостинг YC: **в проде** — https://ohmybudget.by.
Безопасность: UFW/fail2ban применены (`docs/14-hosting-security.md`).
Открыто: YC SG в консоли, S3-бэкапы, почта.
