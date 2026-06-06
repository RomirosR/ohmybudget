"""Наполнение справочников стартовыми данными. Идемпотентно."""

from sqlalchemy.orm import Session

from app.models import AssetType, Month, SecurityType

MONTHS = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
]

SECURITY_TYPES = ["Вклад", "Облигация"]

ASSET_TYPES = [
    "Наличные",
    "Карта",
    "Вклад",
    "Облигации",
    "Брокерский счёт",
    "Другое",
]


def seed_lookups(db: Session) -> None:
    """Заполнить справочники, если они пусты. Безопасно вызывать повторно."""
    if db.query(Month).count() == 0:
        db.add_all(
            Month(name=name, order_index=i)
            for i, name in enumerate(MONTHS, start=1)
        )

    if db.query(SecurityType).count() == 0:
        db.add_all(SecurityType(name=name) for name in SECURITY_TYPES)

    if db.query(AssetType).count() == 0:
        db.add_all(AssetType(name=name) for name in ASSET_TYPES)

    db.commit()
