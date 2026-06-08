# Журнал: миграция на PostgreSQL (dual-DB)

> Рабочий журнал интеграции PostgreSQL. Подробности по слоям — в `docs/01-data-layer.md`,
> `docs/04-infra-run.md`. Итоговая архитектура — в `docs/00-overview.md`.

## Шаг 0 — старт ветки (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:** создана ветка `feature/postgres-auth` от `main` для работ по PostgreSQL
и мультипользовательской авторизации.

**Почему так:** изоляция крупной фичи в отдельной ветке; каждый коммит — атомарная
задача + запись в журнале.

**Как проверить:** `git branch --show-current` → `feature/postgres-auth`.

## Шаг 1 — драйвер psycopg и пример env (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- добавлен `psycopg[binary]>=3.1` в `backend/pyproject.toml`;
- создан `backend/.env.example` с `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES`;
- добавлен корневой `.gitignore` (`.env`, `*.db`, `.venv`, `node_modules`).

**Почему так:** PostgreSQL в SQLAlchemy 2 требует драйвер `psycopg`; dual-DB — URL через env,
без смены кода при переключении SQLite ↔ PostgreSQL.

**Как проверить:** `cd backend && pip install -e .` — пакет `psycopg` в списке зависимостей.
