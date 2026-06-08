"""add user_id to domain tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-08 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DOMAIN_TABLES = ("monthly_plans", "operations", "investments", "assets", "month_settings")


def _is_sqlite() -> bool:
    return op.get_bind().dialect.name == "sqlite"


def _add_user_id(table: str) -> None:
    op.execute(sa.text(f"DELETE FROM {table}"))
    if _is_sqlite():
        with op.batch_alter_table(table) as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=False))
            batch_op.create_foreign_key(
                f"fk_{table}_user_id", "users", ["user_id"], ["id"]
            )
            batch_op.create_index(f"ix_{table}_user_id", ["user_id"])
    else:
        op.add_column(table, sa.Column("user_id", sa.Integer(), nullable=False))
        op.create_foreign_key(f"fk_{table}_user_id", table, "users", ["user_id"], ["id"])
        op.create_index(f"ix_{table}_user_id", table, ["user_id"])


def upgrade() -> None:
    for table in _DOMAIN_TABLES:
        if table != "month_settings":
            _add_user_id(table)

    op.execute(sa.text("DELETE FROM month_settings"))
    if _is_sqlite():
        with op.batch_alter_table("month_settings") as batch_op:
            batch_op.drop_constraint("uq_month_settings_year_month", type_="unique")
            batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=False))
            batch_op.create_foreign_key(
                "fk_month_settings_user_id", "users", ["user_id"], ["id"]
            )
            batch_op.create_index("ix_month_settings_user_id", ["user_id"])
            batch_op.create_unique_constraint(
                "uq_month_settings_user_year_month", ["user_id", "year", "month"]
            )
    else:
        op.drop_constraint("uq_month_settings_year_month", "month_settings", type_="unique")
        op.add_column("month_settings", sa.Column("user_id", sa.Integer(), nullable=False))
        op.create_foreign_key(
            "fk_month_settings_user_id", "month_settings", "users", ["user_id"], ["id"]
        )
        op.create_index("ix_month_settings_user_id", "month_settings", ["user_id"])
        op.create_unique_constraint(
            "uq_month_settings_user_year_month",
            "month_settings",
            ["user_id", "year", "month"],
        )


def downgrade() -> None:
    if _is_sqlite():
        with op.batch_alter_table("month_settings") as batch_op:
            batch_op.drop_constraint("uq_month_settings_user_year_month", type_="unique")
            batch_op.drop_index("ix_month_settings_user_id")
            batch_op.drop_constraint("fk_month_settings_user_id", type_="foreignkey")
            batch_op.drop_column("user_id")
            batch_op.create_unique_constraint(
                "uq_month_settings_year_month", ["year", "month"]
            )
    else:
        op.drop_constraint("uq_month_settings_user_year_month", "month_settings", type_="unique")
        op.drop_constraint("fk_month_settings_user_id", "month_settings", type_="foreignkey")
        op.drop_index("ix_month_settings_user_id", table_name="month_settings")
        op.drop_column("month_settings", "user_id")
        op.create_unique_constraint(
            "uq_month_settings_year_month", "month_settings", ["year", "month"]
        )

    for table in reversed(_DOMAIN_TABLES):
        if table == "month_settings":
            continue
        if _is_sqlite():
            with op.batch_alter_table(table) as batch_op:
                batch_op.drop_index(f"ix_{table}_user_id")
                batch_op.drop_constraint(f"fk_{table}_user_id", type_="foreignkey")
                batch_op.drop_column("user_id")
        else:
            op.drop_constraint(f"fk_{table}_user_id", table, type_="foreignkey")
            op.drop_index(f"ix_{table}_user_id", table_name=table)
            op.drop_column(table, "user_id")
