from pydantic import BaseModel, ConfigDict

from app.schemas.fields import (
    AnnualRate,
    CurrentValue,
    InstrumentName,
    LookupId,
    PayoutsPerYear,
)


class InvestmentBase(BaseModel):
    name: InstrumentName
    security_type_id: LookupId
    annual_rate: AnnualRate
    payouts_per_year: PayoutsPerYear
    current_value: CurrentValue


class InvestmentCreate(InvestmentBase):
    pass


class InvestmentUpdate(InvestmentBase):
    pass


class InvestmentOut(InvestmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    monthly_income: float  # вычисляется в сервисе


class InvestmentList(BaseModel):
    """Список инвестиций + общий среднемесячный доход (Лист 4)."""

    items: list[InvestmentOut]
    total_monthly_income: float
