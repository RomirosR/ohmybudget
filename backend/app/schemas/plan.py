from pydantic import BaseModel, ConfigDict


class PlanBase(BaseModel):
    year: int
    month: int  # 1..12
    category: str
    is_income: bool
    amount: float


class PlanCreate(PlanBase):
    pass


class PlanUpdate(PlanBase):
    pass


class PlanOut(PlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
