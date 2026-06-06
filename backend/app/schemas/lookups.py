from pydantic import BaseModel, ConfigDict


class SecurityTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class AssetTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
