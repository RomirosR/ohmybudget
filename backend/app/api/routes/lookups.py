from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import lookup_repo
from app.schemas.lookups import AssetTypeOut, SecurityTypeOut

router = APIRouter(prefix="/api/lookups", tags=["lookups"])


@router.get("/security-types", response_model=list[SecurityTypeOut])
def get_security_types(db: Session = Depends(get_db)):
    return lookup_repo.list_security_types(db)


@router.get("/asset-types", response_model=list[AssetTypeOut])
def get_asset_types(db: Session = Depends(get_db)):
    return lookup_repo.list_asset_types(db)
