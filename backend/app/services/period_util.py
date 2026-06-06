"""Утилиты периодов. Месяц — число 1..12 (само по себе задаёт порядок)."""


def sort_key(year: int, month: int) -> tuple[int, int]:
    """Ключ хронологической сортировки (год, номер месяца)."""
    return (year, month)


def next_month(year: int, month: int) -> tuple[int, int]:
    """Следующий месяц по календарю. Декабрь (12) → январь (1) следующего года."""
    if month >= 12:
        return (year + 1, 1)
    return (year, month + 1)
