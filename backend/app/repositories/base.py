from typing import Generic, TypeVar

from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class CRUDRepository(Generic[ModelT]):
    """Базовый репозиторий: типовые CRUD-операции над одной моделью.

    Изолирует остальные слои от деталей SQLAlchemy.
    """

    def __init__(self, model: type[ModelT]):
        self.model = model

    def list(self, db: Session) -> list[ModelT]:
        return db.query(self.model).all()

    def get(self, db: Session, obj_id: int) -> ModelT | None:
        return db.get(self.model, obj_id)

    def create(self, db: Session, data: dict) -> ModelT:
        obj = self.model(**data)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def update(self, db: Session, obj: ModelT, data: dict) -> ModelT:
        for key, value in data.items():
            setattr(obj, key, value)
        db.commit()
        db.refresh(obj)
        return obj

    def delete(self, db: Session, obj: ModelT) -> None:
        db.delete(obj)
        db.commit()
