from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SecurityType(Base):
    """Справочник типов ценных бумаг (Вклад, Облигация, ...)."""

    __tablename__ = "security_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
