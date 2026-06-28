from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.auth import get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.plan_repo import plan_repo
from app.services.statement_parsers import BANKS

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/categories", response_model=list[str])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    """Уникальные категории из планов — подсказки для формы операций."""
    if current_user is None:
        return []
    return plan_repo.distinct_categories(db, current_user.id)


@router.get("/import-banks", response_model=list[dict])
def get_import_banks():
    """Список банков, для которых доступен PDF-импорт выписки."""
    return BANKS
