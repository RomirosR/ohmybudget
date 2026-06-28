"""Реестр парсеров банковских выписок. Новый банк = новый модуль + строка здесь."""

from collections.abc import Callable

from app.services.statement_parsers import alfa_by

PARSERS: dict[str, Callable[[bytes], list[dict]]] = {
    "alfa_by": alfa_by.parse,
}

BANKS: list[dict] = [
    {"id": "alfa_by", "label": "Альфа-Банк (РБ)"},
]
