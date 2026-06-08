from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MonthSetting(Base):
    """Настройки месяца: остаток на начало (п.1 листа «Сводка»).

    Месяц — число 1..12. Уникально по (year, month) — одна запись на месяц.
    """

    __tablename__ = "month_settings"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "year", "month", name="uq_month_settings_user_year_month"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)  # 1..12
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
