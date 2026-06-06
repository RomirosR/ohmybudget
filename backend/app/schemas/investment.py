from pydantic import BaseModel, ConfigDict


class InvestmentBase(BaseModel):
    name: str
    security_type_id: int
    annual_rate: float  # проценты
    payouts_per_year: float
    current_value: float


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
