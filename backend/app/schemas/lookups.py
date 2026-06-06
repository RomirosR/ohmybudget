from pydantic import BaseModel, ConfigDict


class MonthOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    order_index: int


class SecurityTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class AssetTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
