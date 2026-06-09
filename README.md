# OhMyBudget

Личный бюджет-трекер: планы по месяцам, операции, сводка, инвестиции, активы,
история и графики. Веб-приложение с изоляцией слоёв (frontend / backend / данные).

- **Backend + данные:** Python + FastAPI + SQLite/PostgreSQL (SQLAlchemy + Alembic)
- **Frontend:** React + TypeScript + Vite + TanStack Query + Recharts
- **Авторизация:** JWT Bearer, мультипользователь, изоляция данных по `user_id`

Подробная документация по архитектуре — в каталоге [`docs/`](docs/).
Журналы миграции: [`docs/06-postgres-migration.md`](docs/06-postgres-migration.md),
[`docs/07-auth.md`](docs/07-auth.md).

## Структура

```
backend/    FastAPI + SQLite/PostgreSQL (модели, репозитории, сервисы-расчёты, API)
frontend/   React SPA (api-клиент, auth, страницы-«листы», графики)
docs/       выжимка по проекту и слоям
```

## Запуск через Docker Compose

```bash
docker compose up --build
```

Production (Yandex Cloud, TLS на nginx хоста): см. [`docs/13-hosting-yc.md`](docs/13-hosting-yc.md).
- Frontend: http://localhost:5173
- Backend (Swagger): http://localhost:8000/docs
- PostgreSQL 16 (данные в volume `postgres-data`)

Миграции и наполнение справочников выполняются автоматически при старте бэкенда.
При первом открытии UI — регистрация нового пользователя.

## Локальный запуск

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head          # SQLite по умолчанию; см. .env.example для PostgreSQL
uvicorn app.main:app --reload # http://127.0.0.1:8000 , Swagger на /docs
```

> После обновления с версии без auth: `rm ohmybudget.db && alembic upgrade head`

### Frontend
```bash
cd frontend
npm install
npm run dev                   # http://127.0.0.1:5173 (проксирует /api → :8000)
```

> Требуется Node.js (проверено на v22+). На macOS: `brew install node`.

### Переменные окружения

См. [`backend/.env.example`](backend/.env.example): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES`.

## Тесты

```bash
cd backend && pytest                       # расчёты + auth + smoke API
cd frontend && npm run build               # tsc + сборка
```

## Что где (листы → экраны)

| Лист              | Экран            | Логика                                              |
|-------------------|------------------|-----------------------------------------------------|
| Планы по месяцам  | Планы            | CRUD планов, копирование месяца (`clone-next`)      |
| Операции          | Операции         | CRUD операций, сортировка на клиенте                |
| Сводка            | Сводка           | 12 расчётных показателей за месяц                   |
| Инвестиции        | Инвестиции       | среднемесячный доход (скелет)                       |
| Активы            | Активы           | список + ИТОГО                                      |
| История           | История          | сводка по всем месяцам                              |
| Графики           | Графики          | план vs факт, отклонения (Recharts)                 |

Производные листы (Сводка, История, Графики) **вычисляются на бэке**, в БД не хранятся.
