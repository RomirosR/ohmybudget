# Слой данных

> Dual-DB: SQLite (локальная разработка, pytest) / PostgreSQL (Docker Compose).
> SQLAlchemy 2.0 + Alembic. Единственный слой, знающий про SQL. Наружу отдаёт данные
> только через `repositories/` (ORM-детали не утекают выше).
> Журнал миграции — [`docs/06-postgres-migration.md`](06-postgres-migration.md).

## Принципы

- Хранятся **только факты**: 4 сущности (планы, операции, инвестиции, активы),
  справочники и настройки месяца. Производные показатели (Сводка/История/Графики)
  **не хранятся** — считаются в `services/`.
- Справочники вынесены в таблицы (не константы в коде), наполняются seed-миграцией.
- Доход/Расход — булево поле `is_income`, не строка.
- Период плана — `year + month_id (FK)`, а не дата и не строка месяца.

## Справочники (seed-миграция при старте)

```
months          id, name(str), order_index(int, unique)
                # Январь..Декабрь → order_index 1..12

security_types  id, name(str)
                # стартовый набор: Вклад, Облигация

asset_types     id, name(str)
                # Наличные, Карта, Вклад, Облигации, Брокерский счёт, Другое
```

## Сущности

```
monthly_plans   id    PK
                year          int        NOT NULL
                month_id      int        FK → months.id, NOT NULL
                category      str        NOT NULL
                is_income     bool       NOT NULL
                amount        float      NOT NULL
                # без position — порядок отображения задаёт клиент

operations      id    PK
                date          date       NOT NULL
                is_income     bool       NOT NULL
                category      str        NOT NULL
                description   str
                amount        float      NOT NULL

investments     id    PK                 # скелет, доработка позже
                name              str    NOT NULL
                security_type_id  int    FK → security_types.id, NOT NULL
                annual_rate       float  NOT NULL   # в процентах
                payouts_per_year  float  NOT NULL   # без ограничения значений
                current_value     float  NOT NULL
                # monthly_income НЕ хранится — вычисляется в сервисе

assets          id    PK
                date          date       NOT NULL
                asset_type_id int        FK → asset_types.id, NOT NULL
                amount        float      NOT NULL

month_settings  id    PK
                year          int        NOT NULL
                month_id      int        FK → months.id, NOT NULL
                opening_balance float    NOT NULL   # п.1 листа «Сводка»
                # UNIQUE (year, month_id)
```

## Файлы (`backend/app/`)

- `db/base.py` — Declarative `Base`.
- `db/session.py` — `engine`, `SessionLocal`, `get_db()` (зависимость FastAPI).
- `db/seed.py` — наполнение справочников (+ опц. демо-данные).
- `models/` — по файлу на таблицу: `month.py`, `security_type.py`, `asset_type.py`,
  `plan.py`, `operation.py`, `investment.py`, `asset.py`, `month_setting.py`.
- `repositories/` — CRUD-обёртки, изолируют ORM: `lookup_repo.py`, `plan_repo.py`,
  `operation_repo.py`, `investment_repo.py`, `asset_repo.py`, `settings_repo.py`.
- `alembic/` — миграции; первая создаёт схему и сидит справочники.

## Замечания по реализации

- FK на справочники → при выдаче наружу резолвим в имена (или отдаём id + отдельный
  справочник на фронт; справочники фронт грузит один раз).
- `month_settings` уникален по `(year, month_id)` — upsert при PUT opening-balance.
- Сопоставление операции с месяцем плана: `operation.date.month` → `order_index`
  месяца, `operation.date.year` → `year`. Логика — в `services/period_util.py`,
  не в слое данных.
