from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.fields import Category, Description, MoneyAmount


class OperationBase(BaseModel):
    date: date
    is_income: bool
    category: Category
    description: Description = ""
    amount: MoneyAmount


class OperationCreate(OperationBase):
    pass


class OperationUpdate(OperationBase):
    pass


class OperationOut(OperationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
