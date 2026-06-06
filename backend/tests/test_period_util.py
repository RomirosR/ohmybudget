from app.services.period_util import next_month, sort_key


def test_next_month_within_year():
    assert next_month(2026, 1) == (2026, 2)
    assert next_month(2026, 11) == (2026, 12)


def test_next_month_rolls_over_december():
    assert next_month(2026, 12) == (2027, 1)


def test_sort_key_orders_chronologically():
    keys = [sort_key(2026, 12), sort_key(2027, 1), sort_key(2026, 1)]
    assert sorted(keys) == [(2026, 1), (2026, 12), (2027, 1)]
