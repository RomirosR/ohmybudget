"""Общие хелперы для парсеров банковских выписок."""

import re
from io import BytesIO

import pdfplumber


def extract_tables(pdf_bytes: bytes) -> list[list[list[str | None]]]:
    """Все таблицы со всех страниц PDF. Бросает ValueError, если файл не PDF."""
    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            tables = []
            for page in pdf.pages:
                tables.extend(page.extract_tables())
            return tables
    except Exception as exc:
        raise ValueError("Не удалось прочитать файл как PDF.") from exc


def clean(cell: str | None) -> str:
    return re.sub(r"\s+", " ", (cell or "")).strip()
