from sqlalchemy import Boolean, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MonthlyPlan(Base):
    """Лист 1: плановая статья дохода/расхода на конкретный (год, месяц).

    Месяц хранится числом 1..12 (Январь..Декабрь); название резолвится на клиенте.
    Тип хранится как is_income (True=доход, False=расход). Порядок отображения
    задаёт клиент — поля position нет.
    """

    __tablename__ = "monthly_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1..12
    category: Mapped[str] = mapped_column(String, nullable=False)
    is_income: Mapped[bool] = mapped_column(Boolean, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
