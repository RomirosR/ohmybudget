# Журнал: email verification + Yandex Cloud Postbox

> Подтверждение email при регистрации. Отправка через Yandex Cloud Postbox (SMTP).

## Шаг 1 — backend: модель и токен (коммит: pending)

**Дата:** 2026-06-09

**Что сделано:**
- поле `users.email_verified_at` (миграция `c3d4e5f6a7b8`);
- JWT-токен с `typ=email_verify` (`create_email_verify_token` / `decode_email_verify_token`);
- `POST /api/auth/register` → письмо, без JWT;
- `GET /api/auth/verify-email?token=…` → подтверждение;
- `POST /api/auth/login` → 403, если email не подтверждён;
- `POST /api/auth/resend-verification` — повторная отправка;
- `app/services/email.py` — transport `console` (dev) / `smtp` (prod).

**Почему так:** stateless-токен в JWT (тот же secret) — без отдельной таблицы; существующие пользователи при миграции получают `email_verified_at = created_at`.

**Как проверить:** `cd backend && pytest tests/test_auth.py`

## Шаг 2 — frontend: UX регистрации (коммит: pending)

**Дата:** 2026-06-09

**Что сделано:**
- после регистрации — экран «Проверьте почту», без автологина;
- ссылка из письма: `https://ohmybudget.by/?verify=<token>` → API verify → модалка входа;
- при 403 на login — кнопка «Отправить письмо ещё раз».

**Как проверить:** `cd frontend && npm run build`; локально register → ссылка в логе backend (console transport).

## Шаг 3 — Yandex Cloud Postbox (ручная настройка в консоли)

**Дата:** 2026-06-09

Postbox **не в MCP** — настраивается в [консоли YC](https://console.yandex.cloud/folders/b1geapdle4ibgnd8pjks/postbox).

### 3.1 Сервисный аккаунт и ключ SMTP

1. Каталог `default` (`b1geapdle4ibgnd8pjks`) — тот же, что ВМ и Postbox-адрес.
2. **IAM → Сервисные аккаунты** → создать (например `postbox-sender`).
3. Роль: `postbox.sender`.
4. **API-ключ** сервисного аккаунта, scope `yc.postbox.send`.
5. Сохранить **ID ключа** → `SMTP_USER`, **секрет** → `SMTP_PASSWORD` (показан один раз).

Дока: [quickstart](https://yandex.cloud/ru/docs/postbox/quickstart), [send-email](https://yandex.cloud/ru/docs/postbox/operations/send-email).

### 3.2 DNS через Yandex Cloud DNS (рекомендуется)

Сейчас NS у регистратора: `u1.hoster.by`, `u2.hoster.by`. DKIM для Postbox можно
поднять в **Cloud DNS** и делегировать домен на YC — проверка быстрее, чем ждать hoster.

#### A) Создать зону в YC (ты в консоли)

1. [Cloud DNS](https://console.yandex.cloud/folders/b1geapdle4ibgnd8pjks/dns/zones) → **Создать зону**
2. Зона: **Публичная**, имя `ohmybudget.by`
3. После создания запомни **NS-адреса зоны** (обычно `ns1.yandexcloud.net`, `ns2.yandexcloud.net`)

#### B) Перенести текущие записи в зону YC

Добавить в зону (как сейчас на hoster):

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `@` | `62.84.127.30` |
| A | `www` | `62.84.127.30` |

#### C) DKIM из Postbox → в ту же зону YC

1. [Postbox → адрес `ohmybudget.by`](https://console.yandex.cloud/folders/b1geapdle4ibgnd8pjks/postbox) → блок **DKIM**
2. Две **CNAME** — создать в Cloud DNS (имя и значение скопировать из Postbox)
3. **SPF** TXT на `@`:
   ```
   v=spf1 include:_spf.yandex.net ~all
   ```

#### D) Делегировать домен на YC (у регистратора / hoster.by)

В панели домена **заменить NS** (удалить старые `u1/u2.hoster.by`):

```
ns1.yandexcloud.net
ns2.yandexcloud.net
```

Сайт не упадёт, если шаг B сделан **до** смены NS.

#### E) Проверка

```bash
dig @ns1.yandexcloud.net ohmybudget.by A +short    # → 62.84.127.30
dig @ns1.yandexcloud.net www.ohmybudget.by A +short
```

Postbox → адрес → DKIM **Success** → «Запустить проверку».

#### Альтернатива без делегирования

Оставить NS на hoster — только 2× CNAME (DKIM) + SPF TXT в панели hoster (без смены NS).

### 3.3 Адрес `noreply@ohmybudget.by` в Postbox

1. **Cloud Postbox → Создать адрес** → домен `ohmybudget.by`, DKIM «Простая» (если ещё нет).
2. CNAME для DKIM — в Cloud DNS (§3.2C) или у hoster (альтернатива).

### 3.4 Секреты на прод-ВМ

В `/opt/ohmybudget/.env.prod` (не в git):

```env
APP_PUBLIC_URL=https://ohmybudget.by
EMAIL_TRANSPORT=smtp
EMAIL_FROM=noreply@ohmybudget.by
SMTP_HOST=postbox.cloud.yandex.net
SMTP_PORT=587
SMTP_USER=<api-key-id>
SMTP_PASSWORD=<api-key-secret>
```

После merge и деплоя — зарегистрировать тестовый аккаунт на проде и проверить входящее письмо.

### 3.5 Локальная разработка

```env
EMAIL_TRANSPORT=console
APP_PUBLIC_URL=http://localhost:5173
```

Ссылка подтверждения печатается в stdout uvicorn.

## Переменные окружения

| Переменная | Dev | Prod |
|------------|-----|------|
| `APP_PUBLIC_URL` | `http://localhost:5173` | `https://ohmybudget.by` |
| `EMAIL_TRANSPORT` | `console` | `smtp` |
| `EMAIL_FROM` | `noreply@ohmybudget.by` | то же |
| `SMTP_USER` / `SMTP_PASSWORD` | — | API-ключ Postbox |
| `EMAIL_VERIFY_EXPIRE_HOURS` | 24 | 24 |

См. `backend/.env.example`, `.env.prod.example`, `docker-compose.prod.yml`.
