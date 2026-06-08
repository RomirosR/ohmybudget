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
