# TODO — чеклист реализации

> Порядок из утверждённого плана. Отмечаем по мере выполнения.

## 0. Подготовка
- [x] Установить Node (brew) — v26 / npm 11 готовы.
- [x] Зафиксировать документацию по слоям (`docs/00..04`).

## 1. Backend skeleton  ← текущий шаг
- [ ] Структура `backend/app/`, `pyproject.toml`.
- [ ] `core/config.py` (путь к БД через env).
- [ ] `db/base.py`, `db/session.py` (engine, SessionLocal, get_db).
- [ ] Модели: справочники (`month`, `security_type`, `asset_type`) + сущности
      (`plan`, `operation`, `investment`, `asset`) + `month_setting`.
- [ ] Alembic init + первая миграция (схема + seed справочников).
- [ ] `db/seed.py` (наполнение справочников, опц. демо-данные).

## 2. CRUD: repositories + schemas + routers
- [ ] `repositories/` (lookup, plan, operation, investment, asset, settings).
- [ ] `schemas/` (lookups, plan, operation, investment, asset, summary).
- [ ] `api/routes/` CRUD: lookups, plans, operations, assets, investments (скелет).
- [ ] `main.py` (CORS + роутеры). Smoke через `/docs`.

## 3. Сервисы расчётов + тесты
- [ ] `services/period_util.py` (next_month, sort_key, date↔месяц).
- [ ] `services/summary_service.py` (12 показателей).
- [ ] `services/history_service.py` (все месяцы).
- [ ] `services/asset_service.py` (ИТОГО), `investment_service.py` (формула, скелет).
- [ ] Роутеры summary/history + `/api/meta/categories`.
- [ ] pytest на формулы + API smoke.

## 4. Лист «Планы»: спец-операции
- [ ] `plan_service.py` — `POST /plans/clone-next`.
- [ ] `PUT /summary/opening-balance` (upsert в month_settings).

## 5. Frontend skeleton
- [ ] Vite + React + TS scaffold.
- [ ] `api/client.ts` + клиенты ресурсов, `types/`, `lib/` (formatType, сортировка).
- [ ] `App.tsx` навигация (7 табов), TanStack Query провайдер.

## 6. CRUD-экраны
- [ ] `PlansPage` (блоки по месяцам, форма, clone-next).
- [ ] `OperationsPage` (форма, сортировка/вставка на клиенте, datalist категорий).
- [ ] `AssetsPage` (форма, сортировка по дате, ИТОГО).
- [ ] `InvestmentsPage` (таблица + среднемесячный доход + общий; минимальный вид).

## 7. Вычисляемые экраны
- [ ] `SummaryPage` (селектор месяца, остаток на начало, 12 показателей).
- [ ] `HistoryPage` (таблица по всем месяцам).
- [ ] `ChartsPage` (Recharts по /api/history).

## 8. Инфра и финал
- [x] Backend `Dockerfile`, frontend `Dockerfile`, `docker-compose.yml`.
- [x] `README.md` (оба способа запуска, миграции, seed).
- [ ] Финальный e2e-прогон по сценарию из `docs/04-infra-run.md`.

## 9. PostgreSQL + авторизация (ветка `feature/postgres-auth`)
- [x] Dual-DB: PostgreSQL в Docker, SQLite локально/pytest — журнал `docs/06-postgres-migration.md`.
- [x] JWT auth: register/login/me, `get_current_user` — журнал `docs/07-auth.md`.
- [x] `user_id` на доменных таблицах, изоляция в repos/routes/services.
- [x] Frontend: LoginPage, AuthContext, Bearer в `client.ts`.
- [x] pytest: auth + tenancy; `npm run build`.
- [ ] PR в `main`, e2e с двумя пользователями.
