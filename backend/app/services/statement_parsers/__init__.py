"""Реестр парсеров банковских выписок. Новый банк = новый модуль + строка здесь."""

from collections.abc import Callable

from app.services.statement_parsers import alfa_by, generic

PARSERS: dict[str, Callable[[bytes], list[dict]]] = {
    "alfa_by": alfa_by.parse,
    "generic": generic.parse,
}

BANKS: list[dict] = [
    {"id": "alfa_by", "label": "Альфа-Банк (РБ)"},
    {"id": "generic", "label": "Другой банк (автоматически по таблице)"},
]
