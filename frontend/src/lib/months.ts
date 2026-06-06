// Названия месяцев резолвятся на клиенте: в БД хранится только число 1..12.

export const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

/** Номера месяцев 1..12 для селектов. */
export const MONTH_NUMBERS = MONTH_NAMES.map((_, i) => i + 1);

/** Имя месяца по номеру 1..12 ("?" если вне диапазона). */
export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "?";
}
