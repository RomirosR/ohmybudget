from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.plan_repo import plan_repo

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/categories", response_model=list[str])
def get_categories(db: Session = Depends(get_db)):
    """Уникальные категории из планов — подсказки для формы операций."""
    return plan_repo.distinct_categories(db)
