from collections.abc import Iterable

from app.models import Asset


def total(assets: Iterable[Asset]) -> float:
    """ИТОГО активов (Лист 5)."""
    return sum(a.amount for a in assets)
