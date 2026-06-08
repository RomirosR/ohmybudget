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

## Шаг 2 — alembic batch mode и pool (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- `render_as_batch` в `alembic/env.py` включается только для SQLite;
- для PostgreSQL в `session.py` добавлен `pool_pre_ping=True`.

**Почему так:** batch mode нужен SQLite для ALTER; на PostgreSQL он лишний. `pool_pre_ping`
восстанавливает соединения после рестарта контейнера postgres.

**Как проверить:** `alembic upgrade head` на SQLite — без ошибок.

## Шаг 3 — PostgreSQL в Docker Compose (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- сервис `postgres` (postgres:16-alpine) с healthcheck;
- `backend` зависит от healthy postgres, `DATABASE_URL` → PostgreSQL;
- volume `postgres-data` вместо SQLite volume `backend-data`.

**Почему так:** в Docker — production-like стек с PostgreSQL; локально без Docker
остаётся SQLite по умолчанию.

**Как проверить:** `docker compose up --build` — backend стартует после postgres healthy.

## Шаг 4 — итог фазы PostgreSQL (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:** обновлены `docs/00-overview.md` и `docs/01-data-layer.md` — dual-DB
зафиксирован в архитектуре.

**Итог фазы:**
- локально / pytest — SQLite (без установки PostgreSQL);
- Docker Compose — PostgreSQL 16;
- переключение только через `DATABASE_URL`;
- Alembic совместим с обоими диалектами.

**Как проверить:** `cd backend && alembic upgrade head && pytest` на SQLite.

---

Фаза PostgreSQL завершена. Дальнейшая работа по авторизации — в [`docs/07-auth.md`](07-auth.md).
