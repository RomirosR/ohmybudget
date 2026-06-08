from sqlalchemy.orm import Session

from app.models import AssetType, SecurityType


def list_security_types(db: Session) -> list[SecurityType]:
    return db.query(SecurityType).order_by(SecurityType.name).all()


def list_asset_types(db: Session) -> list[AssetType]:
    return db.query(AssetType).order_by(AssetType.id).all()


def asset_type_exists(db: Session, type_id: int) -> bool:
    return db.get(AssetType, type_id) is not None


def security_type_exists(db: Session, type_id: int) -> bool:
    return db.get(SecurityType, type_id) is not None
