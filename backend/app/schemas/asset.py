from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.fields import LookupId, MoneyAmount


class AssetBase(BaseModel):
    date: date
    asset_type_id: LookupId
    amount: MoneyAmount


class AssetCreate(AssetBase):
    pass


class AssetUpdate(AssetBase):
    pass


class AssetOut(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AssetList(BaseModel):
    """Список активов + ИТОГО (Лист 5)."""

    items: list[AssetOut]
    total: float
