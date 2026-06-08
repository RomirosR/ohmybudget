"""Лист 1: спец-операции над планами."""

from sqlalchemy.orm import Session

from app.models import MonthlyPlan
from app.repositories.plan_repo import plan_repo
from app.services.period_util import next_month


def clone_next_month(db: Session, user_id: int) -> list[MonthlyPlan] | None:
    """Скопировать все строки последнего по календарю месяца на следующий.

    Возвращает созданные строки или None, если планов ещё нет.
    """
    months = plan_repo.distinct_months(db, user_id)  # отсортированы хронологически
    if not months:
        return None

    last_year, last_month = months[-1]
    new_year, new_month = next_month(last_year, last_month)

    source_rows = plan_repo.list_for_month(db, user_id, last_year, last_month)
    created = [
        MonthlyPlan(
            user_id=user_id,
            year=new_year,
            month=new_month,
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
