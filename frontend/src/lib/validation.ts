/** Ограничения полей — зеркало backend/app/schemas/fields.py */

export const LIMITS = {
  yearMin: 1970,
  yearMax: 2100,
  monthMin: 1,
  monthMax: 12,
  categoryMax: 100,
  descriptionMax: 500,
  nameMax: 200,
  moneyMin: 0.01,
  moneyMax: 1_000_000_000_000,
  balanceMin: -1_000_000_000_000,
  balanceMax: 1_000_000_000_000,
  rateMin: 0,
  rateMax: 1000,
  payoutsMin: 1,
  payoutsMax: 365,
  passwordMin: 8,
  passwordMax: 128,
  usernameMin: 3,
  usernameMax: 32,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export function validateUsername(username: string): string | null {
  const t = username.trim();
  if (!t) return "Укажите ник";
  if (t.length < LIMITS.usernameMin) {
    return `Минимум ${LIMITS.usernameMin} символа`;
  }
  if (t.length > LIMITS.usernameMax) {
    return `Не более ${LIMITS.usernameMax} символов`;
  }
  if (!USERNAME_RE.test(t)) {
    return "Только латиница, цифры и _";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return "Укажите email";
  if (!EMAIL_RE.test(t)) return "Некорректный формат email";
  return null;
}

export function validatePassword(
  password: string,
  mode: "login" | "register",
): string | null {
  if (!password) return "Укажите пароль";
  if (password.length > LIMITS.passwordMax) {
    return `Не более ${LIMITS.passwordMax} символов`;
  }
  if (mode === "register" && password.length < LIMITS.passwordMin) {
    return `Минимум ${LIMITS.passwordMin} символов`;
  }
  return null;
}

export function validateCategory(value: string): string | null {
  const t = value.trim();
  if (!t) return "Укажите категорию";
  if (t.length > LIMITS.categoryMax) {
    return `Не более ${LIMITS.categoryMax} символов`;
  }
  return null;
}

export function validateDescription(value: string): string | null {
  const t = value.trim();
  if (t.length > LIMITS.descriptionMax) {
    return `Не более ${LIMITS.descriptionMax} символов`;
  }
  return null;
}

export function validateInstrumentName(value: string): string | null {
  const t = value.trim();
  if (!t) return "Укажите название инструмента";
  if (t.length > LIMITS.nameMax) {
    return `Не более ${LIMITS.nameMax} символов`;
  }
  return null;
}

export function validateYear(value: number): string | null {
  if (!Number.isInteger(value)) return "Год — целое число";
  if (value < LIMITS.yearMin || value > LIMITS.yearMax) {
    return `Год от ${LIMITS.yearMin} до ${LIMITS.yearMax}`;
  }
  return null;
}

export function validateMoney(value: number, label = "Сумма"): string | null {
  if (!Number.isFinite(value)) return `${label}: некорректное число`;
  if (value <= 0) return `${label} должна быть больше 0`;
  if (value > LIMITS.moneyMax) return `${label} слишком большая`;
  return null;
}

export function validateBalance(value: number): string | null {
  if (!Number.isFinite(value)) return "Некорректное число";
  if (value < LIMITS.balanceMin || value > LIMITS.balanceMax) {
    return "Значение вне допустимого диапазона";
  }
  return null;
}

export function validateRate(value: number): string | null {
  if (!Number.isFinite(value)) return "Некорректная ставка";
  if (value < LIMITS.rateMin || value > LIMITS.rateMax) {
    return `Ставка от ${LIMITS.rateMin} до ${LIMITS.rateMax}%`;
  }
  return null;
}

export function validatePayouts(value: number): string | null {
  if (!Number.isFinite(value)) return "Некорректное число выплат";
  if (value < LIMITS.payoutsMin || value > LIMITS.payoutsMax) {
    return `От ${LIMITS.payoutsMin} до ${LIMITS.payoutsMax} выплат в год`;
  }
  return null;
}

export function validateCurrentValue(value: number): string | null {
  if (!Number.isFinite(value)) return "Некорректная стоимость";
  if (value < 0) return "Стоимость не может быть отрицательной";
  if (value > LIMITS.moneyMax) return "Слишком большое значение";
  return null;
}

export function validateDate(value: string): string | null {
  if (!value) return "Укажите дату";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Некорректный формат даты";
  const d = new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "Некорректная дата";
  return null;
}

/** Первое сообщение из набора проверок или null, если всё ок. */
export function firstError(
  ...checks: (string | null | undefined)[]
): string | null {
  for (const c of checks) {
    if (c) return c;
  }
  return null;
}
