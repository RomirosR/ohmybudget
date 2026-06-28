"""Парсер выписки по карте Альфа-Банка (Беларусь), PDF.

Использует табличное извлечение pdfplumber (`extract_tables`) — оно надёжно
сопоставляет ячейки таблицы независимо от переноса текста внутри ячейки
(в отличие от `extract_text`, где перенос строк в ячейках "Тип операции",
"Статус операции" и "Место" перемешивает порядок слов).
"""

import re
from datetime import datetime

from app.services.statement_parsers._common import clean, extract_tables

_TXN_RE = re.compile(r"^\d{10,}$")
_SUCCESS_STATUS = "Завершено успешно"


def parse(pdf_bytes: bytes) -> list[dict]:
    """Возвращает список операций из выписки. Бросает ValueError, если файл не
    является PDF или ни одна строка таблицы не распознана."""
    rows = []
    for table in extract_tables(pdf_bytes):
        rows.extend(_data_rows(table))

    operations = []
    for row in rows:
        status = clean(row[3])
        if status != _SUCCESS_STATUS:
            continue
        operations.append(_to_operation(row))

    if not operations:
        raise ValueError(
            "Не удалось распознать операции в файле — проверьте, что это "
            "выписка по карте Альфа-Банка в ожидаемом формате."
        )
    return operations


def _data_rows(table: list[list[str | None]]) -> list[list[str]]:
    return [row for row in table if row and row[0] and _TXN_RE.match(clean(row[0]).replace(" ", ""))]


def _to_operation(row: list[str]) -> dict:
    date_str = clean(row[1]).split(" ")[0]
    amount_str, _currency = clean(row[4]).split(" ")
    is_income = amount_str.startswith("+")
    amount = float(amount_str.lstrip("+-").replace(",", "."))

    place = clean(row[5])
    country = clean(row[6])
    detail = clean(row[7])

    return {
        "date": datetime.strptime(date_str, "%Y-%m-%d").date(),
        "is_income": is_income,
        "category": detail or "Без категории",
        "description": f"{detail} ({place}, {country})" if detail else f"{place}, {country}",
        "amount": amount,
    }
