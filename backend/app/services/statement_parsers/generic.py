"""Обобщённый парсер выписок: ищет таблицу операций по смыслу заголовков
колонок (дата/сумма/дебет/кредит/описание/статус, RU+EN), а не по фиксированным
индексам — в отличие от parsers, написанных под конкретный банк (см. alfa_by.py).

Все сравнения текста — регистронезависимые (.lower() перед любой проверкой
вхождения подстроки).
"""

import re

from dateutil import parser as date_parser

from app.services.statement_parsers._common import clean, extract_tables

_DATE_KEYWORDS = ["дата", "date", "время", "time"]
_AMOUNT_KEYWORDS = ["сумма", "amount"]
_DEBIT_KEYWORDS = ["дебет", "debit", "расход", "списание"]
_CREDIT_KEYWORDS = ["кредит", "credit", "приход", "зачисление", "пополнение"]
_DESCRIPTION_KEYWORDS = [
    "описание",
    "детализация",
    "назначение",
    "merchant",
    "description",
    "narrative",
    "детали",
]
_STATUS_KEYWORDS = ["статус", "status"]
_ISO_LEADING_YEAR_RE = re.compile(r"^\d{4}[-/]")
_BAD_STATUS_KEYWORDS = [
    "отказ",
    "ошибк",
    "отменен",
    "отменён",
    "fail",
    "declin",
    "cancel",
    "reject",
    "обработке",
    "pending",
]


def parse(pdf_bytes: bytes) -> list[dict]:
    """Возвращает список операций. Бросает ValueError, если файл не PDF или
    ни в одной таблице не нашлось колонок даты и суммы/дебета/кредита."""
    operations = []
    for table in extract_tables(pdf_bytes):
        operations.extend(_parse_table(table))

    if not operations:
        raise ValueError(
            "Не удалось распознать операции в файле — не нашлось таблицы с "
            "колонками даты и суммы. Попробуйте выбрать банк из списка, если "
            "он там есть."
        )
    return operations


def _parse_table(table: list[list[str | None]]) -> list[dict]:
    if not table:
        return []
    columns = _map_columns(table[0])
    if columns is None:
        return []
    operations = []
    for row in table[1:]:
        op = _to_operation(row, columns)
        if op is not None:
            operations.append(op)
    return operations


def _map_columns(header_row: list[str | None]) -> dict | None:
    normalized = [clean(c).lower() for c in header_row]
    date_idx = _find(normalized, _DATE_KEYWORDS)
    amount_idx = _find(normalized, _AMOUNT_KEYWORDS)
    debit_idx = _find(normalized, _DEBIT_KEYWORDS)
    credit_idx = _find(normalized, _CREDIT_KEYWORDS)
    if date_idx is None or (amount_idx is None and debit_idx is None and credit_idx is None):
        return None
    return {
        "date": date_idx,
        "amount": amount_idx,
        "debit": debit_idx,
        "credit": credit_idx,
        "description": _find(normalized, _DESCRIPTION_KEYWORDS),
        "status": _find(normalized, _STATUS_KEYWORDS),
    }


def _find(normalized_headers: list[str], keywords: list[str]) -> int | None:
    for i, header in enumerate(normalized_headers):
        if any(k in header for k in keywords):
            return i
    return None


def _to_operation(row: list[str | None], columns: dict) -> dict | None:
    if not row or columns["date"] >= len(row):
        return None

    date = _parse_date(clean(row[columns["date"]]))
    if date is None:
        return None

    status_idx = columns["status"]
    if status_idx is not None and status_idx < len(row):
        status = clean(row[status_idx]).lower()
        if any(k in status for k in _BAD_STATUS_KEYWORDS):
            return None

    amount, is_income = _resolve_amount(row, columns)
    if amount is None:
        return None

    description_idx = columns["description"]
    description = (
        clean(row[description_idx])
        if description_idx is not None and description_idx < len(row)
        else ""
    )

    return {
        "date": date,
        "is_income": is_income,
        "category": description or "Без категории",
        "description": description,
        "amount": amount,
    }


def _parse_date(text: str):
    if not text:
        return None
    # ISO-подобные строки (год впереди) однозначны: месяц идёт перед днём.
    # dayfirst=True иначе ломает "2026-01-05" -> 2026-05-01.
    dayfirst = not _ISO_LEADING_YEAR_RE.match(text)
    try:
        return date_parser.parse(text, dayfirst=dayfirst).date()
    except (date_parser.ParserError, ValueError, OverflowError):
        return None


def _resolve_amount(row: list[str | None], columns: dict) -> tuple[float | None, bool]:
    if columns["debit"] is not None or columns["credit"] is not None:
        credit_idx, debit_idx = columns["credit"], columns["debit"]
        credit_val = (
            _parse_decimal(clean(row[credit_idx]))
            if credit_idx is not None and credit_idx < len(row)
            else None
        )
        debit_val = (
            _parse_decimal(clean(row[debit_idx]))
            if debit_idx is not None and debit_idx < len(row)
            else None
        )
        if credit_val:
            return abs(credit_val), True
        if debit_val:
            return abs(debit_val), False
        return None, False

    amount_idx = columns["amount"]
    if amount_idx is None or amount_idx >= len(row):
        return None, False
    raw = clean(row[amount_idx])
    value = _parse_decimal(raw)
    if value is None:
        return None, False
    return abs(value), raw.strip().startswith("+")


def _parse_decimal(text: str) -> float | None:
    t = re.sub(r"[^\d,.\-+]", "", text or "")
    if not t or not re.search(r"\d", t):
        return None
    if "," in t and "." in t:
        if t.rfind(",") > t.rfind("."):
            t = t.replace(".", "").replace(",", ".")
        else:
            t = t.replace(",", "")
    elif "," in t:
        tail = t.split(",")[-1]
        if len(tail) in (1, 2):
            t = t.replace(",", ".")
        else:
            t = t.replace(",", "")
    try:
        return float(t)
    except ValueError:
        return None
