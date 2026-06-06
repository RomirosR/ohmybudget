from datetime import date

from pydantic import BaseModel, ConfigDict


class OperationBase(BaseModel):
    date: date
    is_income: bool
    category: str
    description: str = ""
    amount: float


class OperationCreate(OperationBase):
    pass


class OperationUpdate(OperationBase):
    pass


class OperationOut(OperationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
