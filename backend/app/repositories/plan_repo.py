from sqlalchemy.orm import Session

from app.models import Month, MonthlyPlan
from app.repositories.base import CRUDRepository


class PlanRepository(CRUDRepository[MonthlyPlan]):
    def __init__(self) -> None:
        super().__init__(MonthlyPlan)

    def list_for_month(
        self, db: Session, year: int, month_id: int
    ) -> list[MonthlyPlan]:
        return (
            db.query(MonthlyPlan)
            .filter(MonthlyPlan.year == year, MonthlyPlan.month_id == month_id)
            .all()
        )

    def distinct_months(self, db: Session) -> list[tuple[int, int, str, int]]:
        """Уникальные (year, month_id, month_name, order_index) из планов.

        Отсортированы хронологически (год, затем порядок месяца).
        """
        rows = (
            db.query(
                MonthlyPlan.year,
                MonthlyPlan.month_id,
                Month.name,
                Month.order_index,
            )
            .join(Month, Month.id == MonthlyPlan.month_id)
            .distinct()
            .order_by(MonthlyPlan.year, Month.order_index)
            .all()
        )
        return [tuple(r) for r in rows]

    def distinct_categories(self, db: Session) -> list[str]:
        rows = (
            db.query(MonthlyPlan.category)
            .distinct()
            .order_by(MonthlyPlan.category)
            .all()
        )
        return [r[0] for r in rows]


plan_repo = PlanRepository()
