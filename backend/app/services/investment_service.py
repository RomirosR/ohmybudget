"""Лист 4: инвестиции (скелет). Считаем только среднемесячный доход.

Глубокая логика (учёт payouts_per_year, реинвестирование, привязка к статье
плана) отложена.
"""

from collections.abc import Iterable

from app.models import Investment
from app.schemas.investment import InvestmentList, InvestmentOut


def monthly_income(inv: Investment) -> float:
    """(Текущая стоимость × Годовая ставка%) / 12."""
    return inv.current_value * (inv.annual_rate / 100) / 12


def to_out(inv: Investment) -> InvestmentOut:
    return InvestmentOut(
        id=inv.id,
        name=inv.name,
        security_type_id=inv.security_type_id,
        annual_rate=inv.annual_rate,
        payouts_per_year=inv.payouts_per_year,
        current_value=inv.current_value,
        monthly_income=monthly_income(inv),
    )


def build_list(investments: Iterable[Investment]) -> InvestmentList:
    items = [to_out(inv) for inv in investments]
    total = sum(item.monthly_income for item in items)
    return InvestmentList(items=items, total_monthly_income=total)
