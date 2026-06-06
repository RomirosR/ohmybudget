"""Утилиты периодов. Месяцы берутся из таблицы `months` (order_index 1..12),
а не из константы в коде."""


def sort_key(year: int, order_index: int) -> tuple[int, int]:
    """Ключ хронологической сортировки (год, порядковый номер месяца)."""
    return (year, order_index)


def next_month(year: int, order_index: int) -> tuple[int, int]:
    """Следующий месяц по календарю. Декабрь (12) → январь (1) следующего года."""
    if order_index >= 12:
        return (year + 1, 1)
    return (year, order_index + 1)
