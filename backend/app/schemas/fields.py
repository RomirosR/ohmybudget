"""Общие ограничения полей ввода — единый контракт валидации API."""

from typing import Annotated

from pydantic import Field
from pydantic.types import StringConstraints

Year = Annotated[int, Field(ge=1970, le=2100)]
Month = Annotated[int, Field(ge=1, le=12)]

Category = Annotated[
    str, StringConstraints(min_length=1, max_length=100, strip_whitespace=True)
]
Description = Annotated[
    str, StringConstraints(max_length=500, strip_whitespace=True)
]
InstrumentName = Annotated[
    str, StringConstraints(min_length=1, max_length=200, strip_whitespace=True)
]

MoneyAmount = Annotated[float, Field(gt=0, le=1_000_000_000_000)]
Balance = Annotated[float, Field(ge=-1_000_000_000_000, le=1_000_000_000_000)]
AnnualRate = Annotated[float, Field(ge=0, le=1000)]
PayoutsPerYear = Annotated[float, Field(ge=1, le=365)]
CurrentValue = Annotated[float, Field(ge=0, le=1_000_000_000_000)]

LookupId = Annotated[int, Field(ge=1)]

Password = Annotated[str, Field(min_length=8, max_length=128)]
LoginPassword = Annotated[str, Field(min_length=1, max_length=128)]
Username = Annotated[
    str,
    StringConstraints(
        min_length=3,
        max_length=32,
        strip_whitespace=True,
        pattern=r"^[a-zA-Z0-9_]+$",
    ),
]
