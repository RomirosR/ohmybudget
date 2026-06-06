from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.asset_repo import asset_repo
from app.schemas.asset import AssetCreate, AssetList, AssetOut, AssetUpdate
from app.services import asset_service

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=AssetList)
def list_assets(db: Session = Depends(get_db)):
    items = asset_repo.list(db)
    return AssetList(items=items, total=asset_service.total(items))


@router.post("", response_model=AssetOut, status_code=201)
def create_asset(payload: AssetCreate, db: Session = Depends(get_db)):
    return asset_repo.create(db, payload.model_dump())


@router.put("/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: int, payload: AssetUpdate, db: Session = Depends(get_db)):
    obj = asset_repo.get(db, asset_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Актив не найден")
    return asset_repo.update(db, obj, payload.model_dump())


@router.delete("/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    obj = asset_repo.get(db, asset_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Актив не найден")
    asset_repo.delete(db, obj)
