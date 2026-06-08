# Журнал: валидация ввода и защита от инъекций

> Ветка: `feature/input-validation`

## Шаг 1 — Backend: Pydantic-ограничения (коммит: d81caa1)

**Дата:** 2026-06-08

**Что сделано:**
- Общий модуль `backend/app/schemas/fields.py` — типы `Year`, `Month`, `Category`,
  `MoneyAmount`, `Balance` и др. с `Field` / `StringConstraints`.
- Все create/update-схемы (plans, operations, assets, investments, summary, auth)
  переведены на эти типы: диапазоны чисел, длины строк, trim пробелов.
- Проверка FK `asset_type_id` / `security_type_id` в роутах → 422 вместо 500.
- Глобальный обработчик `IntegrityError` → 422.
- Query-параметры `/api/summary?year=&month=` валидируются теми же ограничениями.
- Тесты `backend/tests/test_validation.py` (10 кейсов).

**Почему так:**
- Pydantic — единственный слой валидации на бэке; SQLAlchemy ORM уже защищает от SQL-injection.
- FK проверяем явно до insert, чтобы не отдавать 500 клиенту.
- `StringConstraints(strip_whitespace=True)` — корректный способ trim в Pydantic v2.

**Как проверить:**
```bash
cd backend && pytest tests/test_validation.py
curl -X POST .../api/plans -d '{"year":2026,"month":13,...}'  # → 422
```

## Шаг 2 — Frontend: клиентская валидация (коммит: 648a038)

**Дата:** 2026-06-08

**Что сделано:**
- `frontend/src/lib/validation.ts` — зеркало ограничений бэка + функции проверки.
- `NumberField` — фильтрация нечисловых символов, опция `allowNegative`.
- Все формы (Auth, Планы, Операции, Сводка, Инвестиции, Активы) — проверка перед submit,
  `maxLength` на текстовых полях, компонент `FieldError`.
- `client.ts` — разбор массива ошибок FastAPI 422.

**Почему так:**
- Двойная валидация (клиент + сервер): UX на фронте, безопасность и целостность на бэке.
- React экранирует текст в таблицах — XSS-риск низкий; дополнительная sanitization HTML не нужна.

**Как проверить:**
```bash
cd frontend && npm run build
# В UI: попробовать сумму 0, пустую категорию, month=13 через API
```

## Шаг 3 — Подсказки у числовых полей (коммит: TBD)

**Дата:** 2026-06-08

**Что сделано:**
- `NumberField` показывает серую подсказку под полем (формат ввода: только цифры и т.п.).
- Текст зависит от режима: дробные суммы, целые (год, выплаты), отрицательные (остаток).
- Режим `integerOnly` для года и «выплат в год».

**Как проверить:** открыть любую форму с суммой — под полем видна подсказка; буквы не вводятся.

## Ограничения полей (справочник)

| Поле | Правило |
|------|---------|
| email | EmailStr (Pydantic) / regex на фронте |
| password | 8–128 (register), 1–128 (login) |
| category | 1–100 символов, trim |
| description | 0–500 символов, trim |
| name (инвестиции) | 1–200 символов, trim |
| year | 1970–2100 |
| month | 1–12 |
| amount (план/операция/актив) | > 0, ≤ 10¹² |
| opening_balance | −10¹² … 10¹² |
| annual_rate | 0–1000 % |
| payouts_per_year | 1–365 |
| current_value | ≥ 0 |

## Безопасность

- **SQL injection:** низкий риск — только ORM с bound parameters.
- **XSS:** низкий риск — React text nodes, нет `dangerouslySetInnerHTML`.
- **Некорректные данные:** основной вектор — закрыт Pydantic + FK checks.
