from pydantic import BaseModel


class MonthRef(BaseModel):
    """Пара (год, месяц 1..12) для селекторов Сводки/Истории."""

    year: int
    month: int


class Summary(BaseModel):
    """Лист 3: 12 расчётных показателей за выбранный месяц."""

    year: int
    month: int

    opening_balance: float          # 1. остаток на начало (вручную)
    plan_income: float              # 2. доходы по плану
    plan_expense: float             # 3. расходы по плану
    forecast_plan: float            # 4. прогнозируемый остаток (план)
    fact_income: float              # 5. доходы факт
    fact_expense: float             # 6. расходы факт
    current_balance: float          # 7. текущий остаток (факт)
    deviation_income: float         # 8. отклонение доходов
    deviation_expense: float        # 9. отклонение расходов
    remaining_plan_income: float    # 10. оставшиеся плановые доходы
    remaining_plan_expense: float   # 11. оставшиеся плановые расходы
    expected_end_balance: float     # 12. ожидаемый остаток на конец месяца


class OpeningBalanceIn(BaseModel):
    year: int
    month: int
    opening_balance: float


class HistoryRow(BaseModel):
    """Лист 6: строка сводки по одному месяцу."""

    year: int
    month: int

    plan_income: float
    plan_expense: float
    fact_income: float
    fact_expense: float
    deviation_income: float   # факт − план
    deviation_expense: float  # факт − план
