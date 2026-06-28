"""Интеграционные тесты эндпоинтов импорта PDF-выписки."""

from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample_statement_alfa_by.pdf"


def test_import_banks_lists_alfa(auth_client):
    r = auth_client.get("/api/meta/import-banks")
    assert r.status_code == 200
    assert {b["id"] for b in r.json()} == {"alfa_by"}


def test_parse_unknown_bank_rejected(auth_client):
    r = auth_client.post(
        "/api/operations/import/parse",
        data={"bank": "unknown_bank"},
        files={"file": ("statement.pdf", FIXTURE.read_bytes(), "application/pdf")},
    )
    assert r.status_code == 400


def test_parse_rejects_non_pdf_content_type(auth_client):
    r = auth_client.post(
        "/api/operations/import/parse",
        data={"bank": "alfa_by"},
        files={"file": ("statement.txt", b"hello", "text/plain")},
    )
    assert r.status_code == 400


def test_parse_requires_auth(client):
    r = client.post(
        "/api/operations/import/parse",
        data={"bank": "alfa_by"},
        files={"file": ("statement.pdf", FIXTURE.read_bytes(), "application/pdf")},
    )
    assert r.status_code == 401


def test_parse_returns_preview_rows(auth_client):
    r = auth_client.post(
        "/api/operations/import/parse",
        data={"bank": "alfa_by"},
        files={"file": ("statement.pdf", FIXTURE.read_bytes(), "application/pdf")},
    )
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 3
    assert {row["category"] for row in rows} == {"TEST SHOP", "REFUND PAY", "CAFE XYZ"}


def test_confirm_creates_operations(auth_client):
    parsed = auth_client.post(
        "/api/operations/import/parse",
        data={"bank": "alfa_by"},
        files={"file": ("statement.pdf", FIXTURE.read_bytes(), "application/pdf")},
    ).json()

    selected = [parsed[0]]
    r = auth_client.post("/api/operations/import/confirm", json=selected)
    assert r.status_code == 200
    created = r.json()
    assert len(created) == 1
    assert created[0]["category"] == selected[0]["category"]

    operations = auth_client.get("/api/operations").json()
    assert len(operations) == 1
