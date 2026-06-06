from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.investment_repo import investment_repo
from app.schemas.investment import (
    InvestmentCreate,
    InvestmentList,
    InvestmentOut,
    InvestmentUpdate,
)
from app.services import investment_service

router = APIRouter(prefix="/api/investments", tags=["investments"])


@router.get("", response_model=InvestmentList)
def list_investments(db: Session = Depends(get_db)):
    items = investment_repo.list(db)
    return investment_service.build_list(items)


@router.post("", response_model=InvestmentOut, status_code=201)
def create_investment(payload: InvestmentCreate, db: Session = Depends(get_db)):
    obj = investment_repo.create(db, payload.model_dump())
    return investment_service.to_out(obj)


@router.put("/{inv_id}", response_model=InvestmentOut)
def update_investment(
    inv_id: int, payload: InvestmentUpdate, db: Session = Depends(get_db)
):
    obj = investment_repo.get(db, inv_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Инструмент не найден")
    obj = investment_repo.update(db, obj, payload.model_dump())
    return investment_service.to_out(obj)


@router.delete("/{inv_id}", status_code=204)
def delete_investment(inv_id: int, db: Session = Depends(get_db)):
    obj = investment_repo.get(db, inv_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Инструмент не найден")
    investment_repo.delete(db, obj)
