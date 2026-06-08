from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Investment(Base):
    """Лист 4: вклад/облигация. Скелет — среднемесячный доход считается в сервисе.

    payouts_per_year — float, без ограничения значениями.
    """

    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    security_type_id: Mapped[int] = mapped_column(
        ForeignKey("security_types.id"), nullable=False
    )
    annual_rate: Mapped[float] = mapped_column(Float, nullable=False)  # проценты
    payouts_per_year: Mapped[float] = mapped_column(Float, nullable=False)
    current_value: Mapped[float] = mapped_column(Float, nullable=False)

    security_type = relationship("SecurityType")
