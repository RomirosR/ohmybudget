from datetime import date

from app.models import MonthlyPlan, Operation
from app.repositories import settings_repo
from app.services.summary_service import compute_summary

YEAR = 2026
JAN = 1  # номер месяца (Январь)


def _add_plan(db, *, is_income, amount, category="X", month=JAN):
    db.add(
        MonthlyPlan(
            year=YEAR,
            month=month,
            category=category,
            is_income=is_income,
            amount=amount,
        )
    )
    db.commit()


def _add_op(db, *, is_income, amount, day=15):
    db.add(
        Operation(
            date=date(YEAR, 1, day),
            is_income=is_income,
            category="X",
            description="",
            amount=amount,
        )
    )
    db.commit()


def test_all_twelve_indicators(db_session):
    settings_repo.set_opening_balance(db_session, YEAR, JAN, 5000)
    _add_plan(db_session, is_income=True, amount=100000)
    _add_plan(db_session, is_income=False, amount=30000)
    _add_op(db_session, is_income=True, amount=40000)
    _add_op(db_session, is_income=False, amount=12000)

    s = compute_summary(db_session, YEAR, JAN)

    assert s.opening_balance == 5000             # 1
    assert s.plan_income == 100000               # 2
    assert s.plan_expense == 30000               # 3
    assert s.forecast_plan == 75000              # 4: 5000+100000-30000
    assert s.fact_income == 40000                # 5
    assert s.fact_expense == 12000               # 6
    assert s.current_balance == 33000            # 7: 5000+40000-12000
    assert s.deviation_income == -60000          # 8: 40000-100000
    assert s.deviation_expense == -18000         # 9: 12000-30000
    assert s.remaining_plan_income == 60000      # 10: max(100000-40000,0)
    assert s.remaining_plan_expense == 18000     # 11: max(30000-12000,0)
    assert s.expected_end_balance == 75000       # 12: 33000+60000-18000


def test_remaining_clamped_to_zero_when_fact_exceeds_plan(db_session):
    """Факт > план → остаточные плановые = 0 (граничный случай)."""
    _add_plan(db_session, is_income=True, amount=100000)
    _add_plan(db_session, is_income=False, amount=30000)
    _add_op(db_session, is_income=True, amount=120000)   # доход выше плана
    _add_op(db_session, is_income=False, amount=50000)   # расход выше плана

    s = compute_summary(db_session, YEAR, JAN)

    assert s.remaining_plan_income == 0
    assert s.remaining_plan_expense == 0
    # current = 0+120000-50000 = 70000; expected = 70000+0-0
    assert s.current_balance == 70000
    assert s.expected_end_balance == 70000


def test_empty_month_is_all_zero(db_session):
    s = compute_summary(db_session, YEAR, JAN)
    assert s.plan_income == 0
    assert s.plan_expense == 0
    assert s.fact_income == 0
    assert s.fact_expense == 0
    assert s.expected_end_balance == 0


def test_operations_outside_month_excluded(db_session):
    """Операция февраля не должна попадать в январскую сводку."""
    _add_plan(db_session, is_income=True, amount=100)
    db_session.add(
        Operation(
            date=date(YEAR, 2, 1),
            is_income=True,
            category="X",
            description="",
            amount=999,
        )
    )
    db_session.commit()

    s = compute_summary(db_session, YEAR, JAN)
    assert s.fact_income == 0
