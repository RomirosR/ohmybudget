"""Тесты обобщённого парсера выписок (любой банк по смыслу заголовков)."""

from datetime import date
from pathlib import Path

import pytest

from app.services.statement_parsers import alfa_by, generic

FIXTURES = Path(__file__).parent / "fixtures"
DEBIT_CREDIT = FIXTURES / "sample_statement_generic_debit_credit.pdf"
SIGNED_AMOUNT = FIXTURES / "sample_statement_generic_signed_amount.pdf"
ALFA = FIXTURES / "sample_statement_alfa_by.pdf"


def test_debit_credit_format():
    rows = generic.parse(DEBIT_CREDIT.read_bytes())

    assert len(rows) == 3  # строка со статусом "Rejected" отфильтрована
    by_category = {r["category"]: r for r in rows}

    assert by_category["Grocery Store"]["amount"] == 45.0
    assert by_category["Grocery Store"]["is_income"] is False

    assert by_category["Salary"]["amount"] == 1500.0
    assert by_category["Salary"]["is_income"] is True

    assert by_category["Online Shop"]["date"] == date(2026, 2, 4)


def test_signed_amount_format():
    rows = generic.parse(SIGNED_AMOUNT.read_bytes())

    assert len(rows) == 3
    by_category = {r["category"]: r for r in rows}

    assert by_category["Кафе"]["amount"] == 15.5
    assert by_category["Кафе"]["is_income"] is False

    assert by_category["Зарплата"]["amount"] == 1200.0
    assert by_category["Зарплата"]["is_income"] is True

    assert by_category["Такси"]["date"] == date(2026, 3, 7)


def test_handles_alfa_format_too():
    """Обобщённый парсер должен корректно разбирать и формат Альфа-Банка —
    проверка того, что подход реально обобщает, а не просто не конфликтует."""
    data = ALFA.read_bytes()
    alfa_rows = alfa_by.parse(data)
    generic_rows = generic.parse(data)

    assert len(generic_rows) == len(alfa_rows) == 3
    for alfa_row, generic_row in zip(alfa_rows, generic_rows):
        assert generic_row["date"] == alfa_row["date"]
        assert generic_row["is_income"] == alfa_row["is_income"]
        assert generic_row["amount"] == alfa_row["amount"]
        assert generic_row["category"] == alfa_row["category"]


def test_raises_on_unrecognizable_file():
    with pytest.raises(ValueError):
        generic.parse(b"%PDF-1.4 not a real statement")
