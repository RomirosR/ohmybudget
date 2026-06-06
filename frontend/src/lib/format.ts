// Утилиты отображения.

const moneyFmt = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
  return moneyFmt.format(value);
}

/** Сортировка по дате (ISO-строка). desc = новые сверху. */
export function sortByDate<T extends { date: string; id: number }>(
  items: T[],
  direction: "asc" | "desc" = "desc",
): T[] {
  const sign = direction === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    // при равных датах — по id, чтобы порядок был стабильным
    return cmp !== 0 ? sign * cmp : sign * (a.id - b.id);
  });
}
