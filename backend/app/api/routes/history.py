from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.summary import HistoryRow
from app.services import history_service

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryRow])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return history_service.build_history(db, current_user.id)
