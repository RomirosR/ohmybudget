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
- сервис `backend` — uvicorn на :8000, SQLite-файл в volume, справочники наполняются
  при старте;
- сервис `frontend` — Vite/nginx, проксирует `/api` на backend.

## Переменные окружения

- `DATABASE_URL` (бэк) — путь к SQLite (по умолчанию файл в `backend/`).
- baseURL фронта — dev через прокси Vite; в Docker — через nginx/переменную.

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
