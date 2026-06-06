from sqlalchemy.orm import Session

from app.models import AssetType, Month, SecurityType


def list_months(db: Session) -> list[Month]:
    return db.query(Month).order_by(Month.order_index).all()


def list_security_types(db: Session) -> list[SecurityType]:
    return db.query(SecurityType).order_by(SecurityType.name).all()


def list_asset_types(db: Session) -> list[AssetType]:
    return db.query(AssetType).order_by(AssetType.id).all()
