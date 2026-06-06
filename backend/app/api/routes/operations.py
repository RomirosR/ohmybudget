from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.operation_repo import operation_repo
from app.schemas.operation import OperationCreate, OperationOut, OperationUpdate

router = APIRouter(prefix="/api/operations", tags=["operations"])


@router.get("", response_model=list[OperationOut])
def list_operations(db: Session = Depends(get_db)):
    # Без навязанной сортировки — порядок задаёт клиент.
    return operation_repo.list(db)


@router.post("", response_model=OperationOut, status_code=201)
def create_operation(payload: OperationCreate, db: Session = Depends(get_db)):
    return operation_repo.create(db, payload.model_dump())


@router.put("/{op_id}", response_model=OperationOut)
def update_operation(
    op_id: int, payload: OperationUpdate, db: Session = Depends(get_db)
):
    obj = operation_repo.get(db, op_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Операция не найдена")
    return operation_repo.update(db, obj, payload.model_dump())


@router.delete("/{op_id}", status_code=204)
def delete_operation(op_id: int, db: Session = Depends(get_db)):
    obj = operation_repo.get(db, op_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Операция не найдена")
    operation_repo.delete(db, obj)
