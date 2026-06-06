from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.plan_repo import plan_repo
from app.schemas.plan import PlanCreate, PlanOut, PlanUpdate
from app.services import plan_service

router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.get("", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    return plan_repo.list(db)


@router.post("", response_model=PlanOut, status_code=201)
def create_plan(payload: PlanCreate, db: Session = Depends(get_db)):
    return plan_repo.create(db, payload.model_dump())


@router.post("/clone-next", response_model=list[PlanOut], status_code=201)
def clone_next_month(db: Session = Depends(get_db)):
    """Создать план на следующий месяц копией последнего по календарю."""
    created = plan_service.clone_next_month(db)
    if created is None:
        raise HTTPException(status_code=400, detail="Нет планов для копирования")
    return created


@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: int, payload: PlanUpdate, db: Session = Depends(get_db)):
    obj = plan_repo.get(db, plan_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="План не найден")
    return plan_repo.update(db, obj, payload.model_dump())


@router.delete("/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    obj = plan_repo.get(db, plan_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="План не найден")
    plan_repo.delete(db, obj)
