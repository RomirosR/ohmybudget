from app.models import Investment
from app.repositories.base import CRUDRepository


class InvestmentRepository(CRUDRepository[Investment]):
    def __init__(self) -> None:
        super().__init__(Investment)


investment_repo = InvestmentRepository()
