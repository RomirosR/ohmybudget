# Инфраструктура и запуск

> Два способа запуска: Docker Compose и локально. Тестирование — pytest (бэк) +
> tsc/build (фронт) + ручной e2e.

## Локальный запуск

### Backend
```
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head            # создаёт схему + сидит справочники
uvicorn app.main:app --reload   # http://127.0.0.1:8000 , Swagger на /docs
```

### Frontend
```
cd frontend
npm install
npm run dev                     # http://127.0.0.1:5173 , проксирует /api → :8000
```

> Node v26 / npm 11 установлены через Homebrew. Если `node` не в PATH:
> `export PATH="/opt/homebrew/bin:$PATH"`.

## Docker Compose

```
docker compose up --build
```
- сервис `postgres` — PostgreSQL 16, данные в volume `postgres-data`;
- сервис `backend` — uvicorn на :8000, подключается к postgres, миграции при старте;
- сервис `frontend` — nginx, проксирует `/api` на backend.

Подробности dual-DB — в [`docs/06-postgres-migration.md`](06-postgres-migration.md).

## Production (Yandex Cloud)

Журнал: [`docs/13-hosting-yc.md`](13-hosting-yc.md). Handoff: [`docs/12-hosting-handoff.md`](12-hosting-handoff.md).

```bash
# на сервере, в каталоге клона репо
cp .env.prod.example .env.prod   # POSTGRES_PASSWORD, JWT_SECRET
docker compose --env-file .env.prod \
  -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- Frontend доступен только на `127.0.0.1:8080`; TLS — хостовый nginx (`deploy/nginx/`).
- Первичная настройка Ubuntu: `sudo bash deploy/setup-server.sh`.

## Переменные окружения

- `DATABASE_URL` (бэк) — SQLite по умолчанию (`backend/ohmybudget.db`); в Docker Compose —
  `postgresql+psycopg://…`. Пример — `backend/.env.example`.
- `JWT_SECRET`, `JWT_EXPIRE_MINUTES` — для авторизации (см. `docs/07-auth.md`).
- baseURL фронта — dev через прокси Vite; в Docker — через nginx.

## Тестирование

### Backend (pytest)
```
cd backend && pytest
```
Покрытие (приоритет — расчёты):
- `summary_service` — все 12 показателей, граничные кейсы;
- `history_service` — уникальность/порядок месяцев, пустые месяцы;
- `period_util` — `next_month` декабрь→январь;
- `investment_service`, `asset_service` — формулы и суммы;
- API smoke через `TestClient`.

### Frontend
```
cd frontend && npx tsc --noEmit && npm run build
```

## End-to-end (ручной сценарий)

1. Поднять стек (Docker или локально), убедиться что справочники наполнены.
2. Создать планы за Январь и Февраль (доход «Зарплата», расход «Продукты»).
3. Внести операции за Январь; задать остаток на начало.
4. Сводка за Январь — сверить 12 показателей с ручным расчётом.
5. Активы — ИТОГО и сортировка по дате; Инвестиции — базовый расчёт.
6. История (все месяцы) и Графики.
