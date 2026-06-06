"""Лист 6: сводка по всем месяцам. Переиспользует расчёт summary_service."""

from sqlalchemy.orm import Session

from app.repositories.plan_repo import plan_repo
from app.schemas.summary import HistoryRow
from app.services.summary_service import compute_summary


def build_history(db: Session) -> list[HistoryRow]:
    rows: list[HistoryRow] = []
    # distinct_months уже отсортированы хронологически.
    for year, month_id, name, order_index in plan_repo.distinct_months(db):
        s = compute_summary(db, year, month_id)
        rows.append(
            HistoryRow(
                year=year,
                month_id=month_id,
                month_name=name,
                order_index=order_index,
                plan_income=s.plan_income,
                plan_expense=s.plan_expense,
                fact_income=s.fact_income,
                fact_expense=s.fact_expense,
                deviation_income=s.deviation_income,
                deviation_expense=s.deviation_expense,
            )
        )
    return rows
