"""Лист 3: 12 расчётных показателей за выбранный (год, месяц)."""

from sqlalchemy.orm import Session

from app.models import Month
from app.repositories import settings_repo
from app.repositories.operation_repo import operation_repo
from app.repositories.plan_repo import plan_repo
from app.schemas.summary import MonthRef, Summary


def list_month_refs(db: Session) -> list[MonthRef]:
    """Уникальные (year, month) из планов, отсортированы по возрастанию."""
    return [
        MonthRef(
            year=year,
            month_id=month_id,
            month_name=name,
            order_index=order_index,
        )
        for (year, month_id, name, order_index) in plan_repo.distinct_months(db)
    ]


def compute_summary(db: Session, year: int, month_id: int) -> Summary:
    month = db.get(Month, month_id)
    order_index = month.order_index if month else 0

    plans = plan_repo.list_for_month(db, year, month_id)
    operations = operation_repo.list_for_period(db, year, order_index)

    opening = settings_repo.get_opening_balance(db, year, month_id)

    plan_income = sum(p.amount for p in plans if p.is_income)
    plan_expense = sum(p.amount for p in plans if not p.is_income)
    fact_income = sum(o.amount for o in operations if o.is_income)
    fact_expense = sum(o.amount for o in operations if not o.is_income)

    forecast_plan = opening + plan_income - plan_expense
    current_balance = opening + fact_income - fact_expense
    deviation_income = fact_income - plan_income
    deviation_expense = fact_expense - plan_expense
    remaining_plan_income = max(plan_income - fact_income, 0.0)
    remaining_plan_expense = max(plan_expense - fact_expense, 0.0)
    expected_end_balance = (
        current_balance + remaining_plan_income - remaining_plan_expense
    )

    return Summary(
        year=year,
        month_id=month_id,
        opening_balance=opening,
        plan_income=plan_income,
        plan_expense=plan_expense,
        forecast_plan=forecast_plan,
        fact_income=fact_income,
        fact_expense=fact_expense,
        current_balance=current_balance,
        deviation_income=deviation_income,
        deviation_expense=deviation_expense,
        remaining_plan_income=remaining_plan_income,
        remaining_plan_expense=remaining_plan_expense,
        expected_end_balance=expected_end_balance,
    )
