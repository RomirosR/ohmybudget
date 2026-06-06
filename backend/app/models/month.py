from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Month(Base):
    """Справочник месяцев. order_index = порядковый номер месяца (1..12)."""

    __tablename__ = "months"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
