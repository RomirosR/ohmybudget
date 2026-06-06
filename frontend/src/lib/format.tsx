// Утилиты отображения.
import { RubleSign } from "../components/RubleSign";

// Форматируем только число (без валюты): группировка разрядов, без дробной части.
// Знак белорусского рубля добавляется отдельно компонентом RubleSign,
// т.к. у него нет своего символа в Unicode и Intl его выдать не может.
const numberFmt = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});

/** Денежная сумма: число с разрядами + знак белорусского рубля. */
export function formatMoney(value: number) {
  return (
    <span className="money" style={{ whiteSpace: "nowrap" }}>
      {numberFmt.format(value)}
      <RubleSign />
    </span>
  );
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
