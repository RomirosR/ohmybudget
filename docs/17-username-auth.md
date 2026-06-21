# Журнал: ник + расширенный auth

> Вход по нику; email — для писем (подтверждение, сброс пароля, смена email).

## Шаг 1 — username и новые endpoints (коммит: pending)

**Дата:** 2026-06-20

**Что сделано:**
- поле `users.username` (уникальный, lowercase), миграция `d4e5f6a7b8c9`;
- регистрация: ник + email + пароль → письмо подтверждения;
- вход: ник + пароль (email не для логина);
- `POST /api/auth/forgot-password` → письмо `/?reset=token`;
- `POST /api/auth/reset-password`;
- `POST /api/auth/request-email-change` (авторизован);
- `GET /api/auth/confirm-email-change?token=`;
- `deploy/wipe-user-data.sh` — очистка пользователей и данных на проде.

**Как проверить:** `cd backend && pytest tests/test_auth.py`

## Шаг 2 — frontend (коммит: pending)

**Модалки:** регистрация/вход/забыли пароль/новый пароль; «Аккаунт» — смена email. В шапке — ник.

**URL из писем:** `?verify=`, `?reset=`, `?email-change=`

## Очистка прода (один раз после деплоя)

```bash
ssh -i ~/.ssh/githubpersonal ubuntu@62.84.127.30
cd /opt/ohmybudget && sudo bash deploy/wipe-user-data.sh
```

Удаляет всех пользователей и их планы/операции/активы. Справочники (типы активов и т.д.) остаются.

## API (кратко)

| Endpoint | Назначение |
|----------|------------|
| `POST /register` | `{username, email, password}` |
| `POST /login` | `{username, password}` |
| `POST /forgot-password` | `{email}` |
| `POST /reset-password` | `{token, password}` |
| `POST /request-email-change` | Bearer + `{new_email}` |
| `GET /confirm-email-change` | `?token=` |
