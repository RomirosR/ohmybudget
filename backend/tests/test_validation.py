"""Тесты валидации входных данных API."""


def test_plan_rejects_invalid_month(auth_client):
    r = auth_client.post(
        "/api/plans",
        json={
            "year": 2026,
            "month": 13,
            "category": "X",
            "is_income": True,
            "amount": 100,
        },
    )
    assert r.status_code == 422


def test_plan_rejects_zero_amount(auth_client):
    r = auth_client.post(
        "/api/plans",
        json={
            "year": 2026,
            "month": 1,
            "category": "X",
            "is_income": True,
            "amount": 0,
        },
    )
    assert r.status_code == 422


def test_plan_rejects_empty_category(auth_client):
    r = auth_client.post(
        "/api/plans",
        json={
            "year": 2026,
            "month": 1,
            "category": "   ",
            "is_income": True,
            "amount": 100,
        },
    )
    assert r.status_code == 422


def test_plan_strips_category_whitespace(auth_client):
    r = auth_client.post(
        "/api/plans",
        json={
            "year": 2026,
            "month": 1,
            "category": "  Зарплата  ",
            "is_income": True,
            "amount": 100,
        },
    )
    assert r.status_code == 201
    assert r.json()["category"] == "Зарплата"


def test_operation_rejects_oversized_description(auth_client):
    r = auth_client.post(
        "/api/operations",
        json={
            "date": "2026-01-01",
            "is_income": False,
            "category": "Еда",
            "description": "x" * 501,
            "amount": 100,
        },
    )
    assert r.status_code == 422


def test_asset_rejects_unknown_type(auth_client):
    r = auth_client.post(
        "/api/assets",
        json={"date": "2026-01-01", "asset_type_id": 9999, "amount": 100},
    )
    assert r.status_code == 422
    assert "тип актива" in r.json()["detail"]


def test_investment_rejects_unknown_security_type(auth_client):
    r = auth_client.post(
        "/api/investments",
        json={
            "name": "Test",
            "security_type_id": 9999,
            "annual_rate": 10,
            "payouts_per_year": 12,
            "current_value": 1000,
        },
    )
    assert r.status_code == 422
    assert "ценной бумаги" in r.json()["detail"]


def test_investment_rejects_negative_rate(auth_client):
    r = auth_client.post(
        "/api/investments",
        json={
            "name": "Test",
            "security_type_id": 1,
            "annual_rate": -1,
            "payouts_per_year": 12,
            "current_value": 1000,
        },
    )
    assert r.status_code == 422


def test_summary_rejects_invalid_month_query(auth_client):
    r = auth_client.get("/api/summary", params={"year": 2026, "month": 0})
    assert r.status_code == 422


def test_login_rejects_oversized_password(client):
    r = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "x" * 129},
    )
    assert r.status_code == 422
