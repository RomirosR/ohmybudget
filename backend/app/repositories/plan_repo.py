from sqlalchemy.orm import Session

from app.models import MonthlyPlan
from app.repositories.base import CRUDRepository


class PlanRepository(CRUDRepository[MonthlyPlan]):
    def __init__(self) -> None:
        super().__init__(MonthlyPlan)

    def list_for_month(
        self, db: Session, year: int, month: int
    ) -> list[MonthlyPlan]:
        return (
            db.query(MonthlyPlan)
            .filter(MonthlyPlan.year == year, MonthlyPlan.month == month)
            .all()
        )

    def distinct_months(self, db: Session) -> list[tuple[int, int]]:
        """Уникальные (year, month) из планов, отсортированы хронологически.

        Месяц — число 1..12, поэтому порядок задаётся им напрямую.
        """
        rows = (
            db.query(MonthlyPlan.year, MonthlyPlan.month)
            .distinct()
            .order_by(MonthlyPlan.year, MonthlyPlan.month)
            .all()
        )
        return [(r[0], r[1]) for r in rows]

    def distinct_categories(self, db: Session) -> list[str]:
        rows = (
            db.query(MonthlyPlan.category)
            .distinct()
            .order_by(MonthlyPlan.category)
            .all()
        )
        return [r[0] for r in rows]


plan_repo = PlanRepository()
