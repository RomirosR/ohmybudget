from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user, get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.repositories.operation_repo import operation_repo
from app.schemas.operation import OperationCreate, OperationOut, OperationUpdate
from app.services.statement_parsers import PARSERS

router = APIRouter(prefix="/api/operations", tags=["operations"])

MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024


@router.get("", response_model=list[OperationOut])
def list_operations(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    if current_user is None:
        return []
    return operation_repo.list(db, current_user.id)


@router.post("", response_model=OperationOut, status_code=201)
def create_operation(
    payload: OperationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = {**payload.model_dump(), "user_id": current_user.id}
    return operation_repo.create(db, data)


@router.put("/{op_id}", response_model=OperationOut)
def update_operation(
    op_id: int,
    payload: OperationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = operation_repo.get(db, current_user.id, op_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Операция не найдена")
    return operation_repo.update(db, obj, payload.model_dump())


@router.delete("/{op_id}", status_code=204)
def delete_operation(
    op_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = operation_repo.get(db, current_user.id, op_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Операция не найдена")
    operation_repo.delete(db, obj)


@router.post("/import/parse", response_model=list[OperationCreate])
def parse_statement(
    bank: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Распознаёт операции из PDF-выписки — без сохранения в БД (превью)."""
    parser = PARSERS.get(bank)
    if parser is None:
        raise HTTPException(status_code=400, detail="Неизвестный банк")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Ожидается файл PDF")

    content = file.file.read(MAX_IMPORT_FILE_SIZE + 1)
    if len(content) > MAX_IMPORT_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Файл слишком большой")

    try:
        rows = parser(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return rows


@router.post("/import/confirm", response_model=list[OperationOut])
def confirm_import(
    payload: list[OperationCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Сохраняет выбранные пользователем строки превью как операции."""
    return [
        operation_repo.create(db, {**item.model_dump(), "user_id": current_user.id})
        for item in payload
    ]
