from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import settings_repo
from app.schemas.summary import MonthRef, OpeningBalanceIn, Summary
from app.services import summary_service

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("/months", response_model=list[MonthRef])
def get_months(db: Session = Depends(get_db)):
    return summary_service.list_month_refs(db)


@router.get("", response_model=Summary)
def get_summary(year: int, month_id: int, db: Session = Depends(get_db)):
    return summary_service.compute_summary(db, year, month_id)


@router.put("/opening-balance", response_model=Summary)
def set_opening_balance(payload: OpeningBalanceIn, db: Session = Depends(get_db)):
    settings_repo.set_opening_balance(
        db, payload.year, payload.month_id, payload.opening_balance
    )
    return summary_service.compute_summary(db, payload.year, payload.month_id)
