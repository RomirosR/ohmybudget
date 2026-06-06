from datetime import date

from sqlalchemy import Boolean, Date, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Operation(Base):
    """Лист 2: реальная операция (доход/расход) с конкретной датой."""

    __tablename__ = "operations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    is_income: Mapped[bool] = mapped_column(Boolean, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False, default="")
    amount: Mapped[float] = mapped_column(Float, nullable=False)
