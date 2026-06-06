"""Наполнение справочников стартовыми данными. Идемпотентно.

Месяцы больше не справочник — хранятся числом 1..12, имена резолвятся на клиенте.
"""

from sqlalchemy.orm import Session

from app.models import AssetType, SecurityType

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
    if db.query(SecurityType).count() == 0:
        db.add_all(SecurityType(name=name) for name in SECURITY_TYPES)

    if db.query(AssetType).count() == 0:
        db.add_all(AssetType(name=name) for name in ASSET_TYPES)

    db.commit()
