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
