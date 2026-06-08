from app.models import MonthlyPlan
from app.services.history_service import build_history
from tests.conftest import TEST_USER_ID


def _plan(db, year, month, is_income, amount):
    db.add(
        MonthlyPlan(
            user_id=TEST_USER_ID,
            year=year,
            month=month,
            category="X",
            is_income=is_income,
            amount=amount,
        )
    )
    db.commit()


def test_history_chronological_and_unique(db_session):
    _plan(db_session, 2026, 12, True, 10)
    _plan(db_session, 2027, 1, True, 20)
    _plan(db_session, 2026, 1, True, 30)
    _plan(db_session, 2026, 1, False, 5)

    rows = build_history(db_session, TEST_USER_ID)

    keys = [(r.year, r.month) for r in rows]
    assert keys == [(2026, 1), (2026, 12), (2027, 1)]


def test_history_row_matches_summary(db_session):
    _plan(db_session, 2026, 1, True, 100)
    _plan(db_session, 2026, 1, False, 40)

    rows = build_history(db_session, TEST_USER_ID)
    assert len(rows) == 1
    row = rows[0]
    assert row.plan_income == 100
    assert row.plan_expense == 40
    assert row.fact_income == 0
    assert row.deviation_income == -100
