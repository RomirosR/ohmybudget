from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.models import Operation
from app.repositories.base import CRUDRepository


class OperationRepository(CRUDRepository[Operation]):
    def __init__(self) -> None:
        super().__init__(Operation)

    def list_for_period(
        self, db: Session, year: int, month_order: int
    ) -> list[Operation]:
        """Операции за (год, порядковый номер месяца 1..12)."""
        return (
            db.query(Operation)
            .filter(
                extract("year", Operation.date) == year,
                extract("month", Operation.date) == month_order,
            )
            .all()
        )


operation_repo = OperationRepository()
