from app.models import Asset
from app.repositories.base import CRUDRepository


class AssetRepository(CRUDRepository[Asset]):
    def __init__(self) -> None:
        super().__init__(Asset)


asset_repo = AssetRepository()
