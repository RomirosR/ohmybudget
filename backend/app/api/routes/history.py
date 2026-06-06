from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.summary import HistoryRow
from app.services import history_service

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryRow])
def get_history(db: Session = Depends(get_db)):
    return history_service.build_history(db)
