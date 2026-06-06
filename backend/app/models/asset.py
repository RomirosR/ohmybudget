from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Asset(Base):
    """Лист 5: сколько денег в активе на определённую дату."""

    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    asset_type_id: Mapped[int] = mapped_column(
        ForeignKey("asset_types.id"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)

    asset_type = relationship("AssetType")
