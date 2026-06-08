# Backend (логика + API)

> FastAPI + Pydantic v2. Делится на бизнес-логику (`services/` — расчёты по спеке) и
> презентацию (`api/routes/` — HTTP). Контракт наружу — Pydantic-схемы. Про SQL не
> знает — ходит в данные через `repositories/`.
>
> **Авторизация:** JWT Bearer. GET доменных ресурсов — `get_optional_user` (гость → пустые
> данные); POST/PUT/DELETE — `get_current_user`. Публичные: `/api/health`, `/api/auth/*`,
> `/api/lookups/*`. Гостевой режим — `docs/08-guest-mode.md`.
> Подробности — [`docs/07-auth.md`](07-auth.md).

## Pydantic-схемы (`schemas/`)

Единый источник правды контракта; TS-типы фронта их зеркалят. Тип Доход/Расход в
JSON — `is_income: bool`.

- `lookups.py` — `Month`, `SecurityType`, `AssetType`.
- `plan.py` — Plan (read/create/update).
- `operation.py`, `investment.py`, `asset.py` — аналогично.
- `summary.py` — `Summary` (12 показателей), `HistoryRow`.

## Сервисы расчётов (`services/`)

### `period_util.py`
Месяцы берутся из таблицы `months` (с `order_index`), не из константы.
- `sort_key(year, order_index)` — хронологическая сортировка.
- `next_month(year, order_index) -> (year, order_index)` — декабрь→январь, +1 год.
- сопоставление `operation.date` ↔ (year, order_index месяца).

### `summary_service.py` — Лист 3, 12 показателей
Вход: `(year, month_id)`. Берёт планы и операции за месяц, `opening_balance`.
`is_income` разделяет доход/расход.

```
2.  plan_income      = Σ plans.amount  where is_income
3.  plan_expense     = Σ plans.amount  where not is_income
4.  forecast_plan    = opening + plan_income − plan_expense
5.  fact_income      = Σ operations.amount where is_income      (за год+месяц)
6.  fact_expense     = Σ operations.amount where not is_income
7.  current_balance  = opening + fact_income − fact_expense
8.  dev_income       = fact_income − plan_income
9.  dev_expense      = fact_expense − plan_expense
10. remaining_plan_income  = max(plan_income − fact_income, 0)
11. remaining_plan_expense = max(plan_expense − fact_expense, 0)
12. expected_eom     = current_balance + remaining_plan_income − remaining_plan_expense
```
(п.1 `opening` вводится вручную → из `month_settings`.)

### `history_service.py` — Лист 6
Все уникальные `(year, month_id)` из `monthly_plans`, хронологическая сортировка
через `period_util`, для каждого — переиспользует расчёт `summary_service`. Месяцы
без данных → пустые значения.

### `investment_service.py` — Лист 4 (скелет)
- `monthly_income(inv) = inv.current_value * (inv.annual_rate / 100) / 12`.
- `total_monthly_income = Σ`. Глубокая логика (`payouts_per_year`, реинвест,
  привязка к статье плана) — **отложена**.

### `asset_service.py` — Лист 5
- `total = Σ assets.amount`. Сортировку строк делает клиент.

### `plan_service.py` — Лист 1
- `clone-next`: берёт последний по календарю `(year, month_id)`, копирует все строки
  на `next_month`. Суммы потом редактируются.
- Добавление статьи — обычный POST; «в конец блока месяца» обеспечивает клиент.

## API-контракт (`api/routes/`)

```
Auth (публичные register/login; me — Bearer)
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

Lookups
  GET  /api/lookups/months
  GET  /api/lookups/security-types
  GET  /api/lookups/asset-types

Plans
  GET/POST/PUT/DELETE /api/plans[/{id}]      # POST: year, month_id, category, is_income, amount
  POST   /api/plans/clone-next

Operations
  GET/POST/PUT/DELETE /api/operations[/{id}] # GET без навязанной сортировки

Investments (скелет)
  GET    /api/investments                    # список + total_monthly_income
  POST/PUT/DELETE /api/investments[/{id}]

Assets
  GET    /api/assets                         # список + total
  POST/PUT/DELETE /api/assets[/{id}]

Summary
  GET    /api/summary/months                 # уникальные (year, month_id) ↑
  GET    /api/summary?year=&month_id=        # 12 показателей
  PUT    /api/summary/opening-balance        # (year, month_id, value) → upsert

History
  GET    /api/history                        # строки по всем месяцам

Meta
  GET    /api/meta/categories                # уникальные категории из планов
```

## Файлы (`backend/app/`)

- `main.py` — FastAPI, CORS (для Vite-фронта), подключение роутеров.
- `core/config.py` — настройки (путь к БД через env).
- `services/` — см. выше.
- `api/routes/` — `lookups.py`, `plans.py`, `operations.py`, `investments.py`,
  `assets.py`, `summary.py`, `history.py`.

## Тесты (`backend/tests/`, pytest)

Приоритет — расчёты:
- `summary_service`: все 12 показателей (граничные: факт > план → остаточные = 0).
- `history_service`: уникальность + хронологический порядок; пустые месяцы.
- `period_util`: `next_month` декабрь→январь со сменой года.
- `investment_service`: формула + total.
- `asset_service`: ИТОГО.
- API smoke (`TestClient`): CRUD + clone-next + summary + справочники.
