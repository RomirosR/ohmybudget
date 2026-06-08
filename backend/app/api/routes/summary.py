from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.repositories import settings_repo
from app.schemas.summary import MonthRef, OpeningBalanceIn, Summary
from app.services import summary_service

router = APIRouter(prefix="/api/summary", tags=["summary"])


@router.get("/months", response_model=list[MonthRef])
def get_months(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return summary_service.list_month_refs(db, current_user.id)


@router.get("", response_model=Summary)
def get_summary(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return summary_service.compute_summary(db, current_user.id, year, month)


@router.put("/opening-balance", response_model=Summary)
def set_opening_balance(
    payload: OpeningBalanceIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings_repo.set_opening_balance(
        db,
        current_user.id,
        payload.year,
        payload.month,
        payload.opening_balance,
    )
    return summary_service.compute_summary(
        db, current_user.id, payload.year, payload.month
    )
