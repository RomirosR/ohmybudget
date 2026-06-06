def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_lookups_seeded(client):
    assert len(client.get("/api/lookups/security-types").json()) == 2
    assert len(client.get("/api/lookups/asset-types").json()) == 6


def test_plan_crud_and_summary(client):
    r = client.post(
        "/api/plans",
        json={
            "year": 2026, "month": 1, "category": "Зарплата",
            "is_income": True, "amount": 100000,
        },
    )
    assert r.status_code == 201
    plan_id = r.json()["id"]

    # update
    r2 = client.put(
        f"/api/plans/{plan_id}",
        json={
            "year": 2026, "month": 1, "category": "Зарплата",
            "is_income": True, "amount": 120000,
        },
    )
    assert r2.json()["amount"] == 120000

    summary = client.get(
        "/api/summary", params={"year": 2026, "month": 1}
    ).json()
    assert summary["plan_income"] == 120000

    # delete
    assert client.delete(f"/api/plans/{plan_id}").status_code == 204
    assert client.get("/api/plans").json() == []


def test_clone_next_month(client):
    client.post(
        "/api/plans",
        json={
            "year": 2026, "month": 1, "category": "Зарплата",
            "is_income": True, "amount": 100000,
        },
    )
    r = client.post("/api/plans/clone-next")
    assert r.status_code == 201
    created = r.json()
    assert len(created) == 1
    assert created[0]["month"] == 2  # Февраль
    assert created[0]["year"] == 2026


def test_clone_next_with_no_plans_returns_400(client):
    assert client.post("/api/plans/clone-next").status_code == 400


def test_opening_balance_upsert(client):
    client.post(
        "/api/plans",
        json={
            "year": 2026, "month": 1, "category": "X",
            "is_income": True, "amount": 10,
        },
    )
    r = client.put(
        "/api/summary/opening-balance",
        json={"year": 2026, "month": 1, "opening_balance": 5000},
    )
    assert r.json()["opening_balance"] == 5000
    # upsert: повторно меняем
    r2 = client.put(
        "/api/summary/opening-balance",
        json={"year": 2026, "month": 1, "opening_balance": 7000},
    )
    assert r2.json()["opening_balance"] == 7000


def test_assets_total(client):
    client.post(
        "/api/assets",
        json={"date": "2026-01-01", "asset_type_id": 1, "amount": 5000},
    )
    client.post(
        "/api/assets",
        json={"date": "2026-02-01", "asset_type_id": 2, "amount": 12000},
    )
    data = client.get("/api/assets").json()
    assert data["total"] == 17000
    assert len(data["items"]) == 2


def test_investments_total_income(client):
    client.post(
        "/api/investments",
        json={
            "name": "Вклад A", "security_type_id": 1, "annual_rate": 12,
            "payouts_per_year": 12, "current_value": 100000,
        },
    )
    data = client.get("/api/investments").json()
    assert data["total_monthly_income"] == 1000
    assert data["items"][0]["monthly_income"] == 1000
