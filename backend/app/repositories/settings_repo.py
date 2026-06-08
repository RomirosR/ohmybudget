from sqlalchemy.orm import Session

from app.models import MonthSetting


def get_opening_balance(db: Session, user_id: int, year: int, month: int) -> float:
    """Остаток на начало месяца; 0.0 если не задан."""
    row = (
        db.query(MonthSetting)
        .filter(
            MonthSetting.user_id == user_id,
            MonthSetting.year == year,
            MonthSetting.month == month,
        )
        .one_or_none()
    )
    return row.opening_balance if row else 0.0


def set_opening_balance(
    db: Session, user_id: int, year: int, month: int, value: float
) -> MonthSetting:
    """Upsert остатка на начало месяца (уникально по user+year+month)."""
    row = (
        db.query(MonthSetting)
        .filter(
            MonthSetting.user_id == user_id,
            MonthSetting.year == year,
            MonthSetting.month == month,
        )
        .one_or_none()
    )
    if row is None:
        row = MonthSetting(
            user_id=user_id, year=year, month=month, opening_balance=value
        )
        db.add(row)
    else:
        row.opening_balance = value
    db.commit()
    db.refresh(row)
    return row
