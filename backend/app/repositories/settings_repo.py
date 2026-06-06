from sqlalchemy.orm import Session

from app.models import MonthSetting


def get_opening_balance(db: Session, year: int, month_id: int) -> float:
    """Остаток на начало месяца; 0.0 если не задан."""
    row = (
        db.query(MonthSetting)
        .filter(MonthSetting.year == year, MonthSetting.month_id == month_id)
        .one_or_none()
    )
    return row.opening_balance if row else 0.0


def set_opening_balance(
    db: Session, year: int, month_id: int, value: float
) -> MonthSetting:
    """Upsert остатка на начало месяца (уникально по year+month_id)."""
    row = (
        db.query(MonthSetting)
        .filter(MonthSetting.year == year, MonthSetting.month_id == month_id)
        .one_or_none()
    )
    if row is None:
        row = MonthSetting(year=year, month_id=month_id, opening_balance=value)
        db.add(row)
    else:
        row.opening_balance = value
    db.commit()
    db.refresh(row)
    return row
