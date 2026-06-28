"""Тесты парсера выписки Альфа-Банка."""

from pathlib import Path

import pytest

from app.services.statement_parsers import alfa_by

FIXTURE = Path(__file__).parent / "fixtures" / "sample_statement_alfa_by.pdf"


def test_parses_successful_rows_only():
    rows = alfa_by.parse(FIXTURE.read_bytes())

    # 4 строки в выписке, одна со статусом "В обработке" — должна быть отфильтрована.
    assert len(rows) == 3
    assert {r["category"] for r in rows} == {"TEST SHOP", "REFUND PAY", "CAFE XYZ"}


def test_amount_and_sign():
    rows = alfa_by.parse(FIXTURE.read_bytes())
    by_category = {r["category"]: r for r in rows}

    assert by_category["TEST SHOP"]["amount"] == 55.0
    assert by_category["TEST SHOP"]["is_income"] is False

    assert by_category["REFUND PAY"]["amount"] == 20.0
    assert by_category["REFUND PAY"]["is_income"] is True


def test_description_includes_place_and_country():
    rows = alfa_by.parse(FIXTURE.read_bytes())
    cafe = next(r for r in rows if r["category"] == "CAFE XYZ")

    assert cafe["description"] == "CAFE XYZ (GOMEL, BLR)"
    assert cafe["date"].isoformat() == "2026-01-08"


def test_raises_on_unrecognizable_file():
    with pytest.raises(ValueError):
        alfa_by.parse(b"%PDF-1.4 not a real statement")
