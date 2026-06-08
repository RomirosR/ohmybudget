# Журнал: мультипользовательская авторизация (JWT)

> Рабочий журнал внедрения авторизации и изоляции данных по `user_id`.
> Архитектура — в `docs/00-overview.md`, API — в `docs/02-backend-layer.md`.

## Шаг 1 — модель User и зависимости (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- модель `User` в `backend/app/models/user.py` (email, hashed_password, created_at);
- миграция `a1b2c3d4e5f6` — таблица `users`;
- зависимости `passlib[bcrypt]`, `python-jose[cryptography]` в `pyproject.toml`.

**Почему так:** email как уникальный логин; пароль только в виде bcrypt-хэша.

**Как проверить:** `alembic upgrade head` — таблица `users` создана.

## Шаг 2 — JWT config и security (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- `jwt_secret`, `jwt_expire_minutes` в `core/config.py`;
- `core/security.py`: hash/verify password, create/decode JWT (HS256).

**Почему так:** dev-default secret для локальной разработки; prod — через `JWT_SECRET` env.

**Как проверить:** unit-проверка encode/decode в pytest (шаг 7).

## Шаг 3 — register и login (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- `POST /api/auth/register`, `POST /api/auth/login` → JWT;
- `user_repo`, схемы `schemas/auth.py`, роутер подключён в `main.py`.

**Почему так:** регистрация сразу возвращает токен — фронту не нужен второй запрос.

**Как проверить:** Swagger `/docs` — register → login с тем же email.

## Шаг 4 — get_current_user (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- `api/deps/auth.py` — `HTTPBearer` + decode JWT → `User`;
- `GET /api/auth/me` — текущий пользователь по токену.

**Почему так:** единая зависимость для всех защищённых роутов (шаг 6).

**Как проверить:** register → Authorize Bearer → GET `/api/auth/me`.

## Шаг 5 — user_id на доменных таблицах (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- `user_id` FK → `users.id` в `monthly_plans`, `operations`, `investments`, `assets`,
  `month_settings`;
- уникальность `month_settings` — `(user_id, year, month)`;
- миграция `b2c3d4e5f6a7` очищает старые строки без владельца.

**Почему так:** данные до auth не привязаны к пользователю — нужен fresh DB:
`rm backend/ohmybudget.db && alembic upgrade head`.

**Как проверить:** `alembic upgrade head` — колонки `user_id` NOT NULL.

## Шаг 6 — изоляция в repos/routes/services (коммит: pending)

**Дата:** 2026-06-08

**Что сделано:**
- `CRUDRepository` и спец-репозитории фильтруют по `user_id`;
- все доменные роуты требуют `get_current_user`;
- `summary_service`, `history_service`, `plan_service` принимают `user_id`;
- `/api/lookups/*` остаётся публичным.

**Почему так:** единая точка изоляции — репозиторий + зависимость на роуте.

**Как проверить:** без токена `GET /api/plans` → 403; с токеном → 200.
