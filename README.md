# OhMyBudget

Личный бюджет-трекер: планы по месяцам, операции, сводка, инвестиции, активы,
история и графики. Веб-приложение с изоляцией слоёв (frontend / backend / данные).

- **Backend + данные:** Python + FastAPI + SQLite (SQLAlchemy + Alembic)
- **Frontend:** React + TypeScript + Vite + TanStack Query + Recharts

Подробная документация по архитектуре — в каталоге [`docs/`](docs/).

## Структура

```
backend/    FastAPI + SQLite (модели, репозитории, сервисы-расчёты, API)
frontend/   React SPA (api-клиент, страницы-«листы», графики)
docs/       выжимка по проекту и слоям
```

## Запуск через Docker Compose

```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend (Swagger): http://localhost:8000/docs

Миграции и наполнение справочников выполняются автоматически при старте бэкенда.

## Локальный запуск

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head          # создаёт схему + сидит справочники
uvicorn app.main:app --reload # http://127.0.0.1:8000 , Swagger на /docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # http://127.0.0.1:5173 (проксирует /api → :8000)
```

> Требуется Node.js (проверено на v22+). На macOS: `brew install node`.

## Тесты

```bash
cd backend && pytest                       # расчёты + smoke API
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
