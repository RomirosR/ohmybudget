from datetime import date

from app.models import Asset, Investment
from app.services import asset_service, investment_service


def test_investment_monthly_income_formula():
    inv = Investment(
        name="Вклад A",
        security_type_id=1,
        annual_rate=12.0,  # 12% годовых
        payouts_per_year=12,
        current_value=100000,
    )
    # 100000 * 0.12 / 12 = 1000
    assert investment_service.monthly_income(inv) == 1000


def test_investment_total_monthly_income():
    inv1 = Investment(
        id=1, name="A", security_type_id=1, annual_rate=12.0,
        payouts_per_year=12, current_value=100000,
    )
    inv2 = Investment(
        id=2, name="B", security_type_id=1, annual_rate=6.0,
        payouts_per_year=4, current_value=200000,
    )
    result = investment_service.build_list([inv1, inv2])
    # 1000 + (200000*0.06/12=1000) = 2000
    assert result.total_monthly_income == 2000
    assert len(result.items) == 2


def test_asset_total():
    assets = [
        Asset(date=date(2026, 1, 1), asset_type_id=1, amount=5000),
        Asset(date=date(2026, 1, 1), asset_type_id=2, amount=12000),
    ]
    assert asset_service.total(assets) == 17000
