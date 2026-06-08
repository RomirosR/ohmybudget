from datetime import date

from app.models import MonthlyPlan, Operation
from app.repositories import settings_repo
from app.services.summary_service import compute_summary
from tests.conftest import TEST_USER_ID

YEAR = 2026
JAN = 1


def _add_plan(db, *, is_income, amount, category="X", month=JAN):
    db.add(
        MonthlyPlan(
            user_id=TEST_USER_ID,
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
            user_id=TEST_USER_ID,
            date=date(YEAR, 1, day),
            is_income=is_income,
            category="X",
            description="",
            amount=amount,
        )
    )
    db.commit()


def test_all_twelve_indicators(db_session):
    settings_repo.set_opening_balance(db_session, TEST_USER_ID, YEAR, JAN, 5000)
    _add_plan(db_session, is_income=True, amount=100000)
    _add_plan(db_session, is_income=False, amount=30000)
    _add_op(db_session, is_income=True, amount=40000)
    _add_op(db_session, is_income=False, amount=12000)

    s = compute_summary(db_session, TEST_USER_ID, YEAR, JAN)

    assert s.opening_balance == 5000
    assert s.plan_income == 100000
    assert s.plan_expense == 30000
    assert s.forecast_plan == 75000
    assert s.fact_income == 40000
    assert s.fact_expense == 12000
    assert s.current_balance == 33000
    assert s.deviation_income == -60000
    assert s.deviation_expense == -18000
    assert s.remaining_plan_income == 60000
    assert s.remaining_plan_expense == 18000
    assert s.expected_end_balance == 75000


def test_remaining_clamped_to_zero_when_fact_exceeds_plan(db_session):
    _add_plan(db_session, is_income=True, amount=100000)
    _add_plan(db_session, is_income=False, amount=30000)
    _add_op(db_session, is_income=True, amount=120000)
    _add_op(db_session, is_income=False, amount=50000)

    s = compute_summary(db_session, TEST_USER_ID, YEAR, JAN)

    assert s.remaining_plan_income == 0
    assert s.remaining_plan_expense == 0
    assert s.current_balance == 70000
    assert s.expected_end_balance == 70000


def test_empty_month_is_all_zero(db_session):
    s = compute_summary(db_session, TEST_USER_ID, YEAR, JAN)
    assert s.plan_income == 0
    assert s.plan_expense == 0
    assert s.fact_income == 0
    assert s.fact_expense == 0
    assert s.expected_end_balance == 0


def test_operations_outside_month_excluded(db_session):
    _add_plan(db_session, is_income=True, amount=100)
    db_session.add(
        Operation(
            user_id=TEST_USER_ID,
            date=date(YEAR, 2, 1),
            is_income=True,
            category="X",
            description="",
            amount=999,
        )
    )
    db_session.commit()

    s = compute_summary(db_session, TEST_USER_ID, YEAR, JAN)
    assert s.fact_income == 0
