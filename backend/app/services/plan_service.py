"""Лист 1: спец-операции над планами."""

from sqlalchemy.orm import Session

from app.models import Month, MonthlyPlan
from app.repositories.plan_repo import plan_repo
from app.services.period_util import next_month


def clone_next_month(db: Session) -> list[MonthlyPlan] | None:
    """Скопировать все строки последнего по календарю месяца на следующий.

    Возвращает созданные строки или None, если планов ещё нет.
    """
    months = plan_repo.distinct_months(db)  # отсортированы хронологически
    if not months:
        return None

    last_year, last_month_id, _name, last_order = months[-1]
    new_year, new_order = next_month(last_year, last_order)

    # Находим id месяца-справочника по новому порядковому номеру.
    new_month = (
        db.query(Month).filter(Month.order_index == new_order).one()
    )

    source_rows = plan_repo.list_for_month(db, last_year, last_month_id)
    created = [
        MonthlyPlan(
            year=new_year,
            month_id=new_month.id,
            category=row.category,
            is_income=row.is_income,
            amount=row.amount,
        )
        for row in source_rows
    ]
    db.add_all(created)
    db.commit()
    for row in created:
        db.refresh(row)
    return created
