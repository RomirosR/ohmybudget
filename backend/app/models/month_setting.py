from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MonthSetting(Base):
    """Настройки месяца: остаток на начало (п.1 листа «Сводка»).

    Уникально по (year, month_id) — одна запись на месяц.
    """

    __tablename__ = "month_settings"
    __table_args__ = (
        UniqueConstraint("year", "month_id", name="uq_month_settings_year_month"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month_id: Mapped[int] = mapped_column(
        ForeignKey("months.id"), nullable=False
    )
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
