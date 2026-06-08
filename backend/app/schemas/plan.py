from pydantic import BaseModel, ConfigDict

from app.schemas.fields import Category, MoneyAmount, Month, Year


class PlanBase(BaseModel):
    year: Year
    month: Month
    category: Category
    is_income: bool
    amount: MoneyAmount


class PlanCreate(PlanBase):
    pass


class PlanUpdate(PlanBase):
    pass


class PlanOut(PlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
