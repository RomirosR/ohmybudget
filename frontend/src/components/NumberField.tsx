import { useEffect, useState } from "react";

/** Допустимые символы: цифры, минус (если разрешён), одна точка или запятая. */
function sanitizeNumericInput(
  raw: string,
  allowNegative: boolean,
  integerOnly: boolean,
): string {
  let s = raw.replace(/[^\d.,-]/g, "");
  if (!allowNegative) s = s.replace(/-/g, "");
  else {
    // Минус только в начале.
    s = s.replace(/(?!^)-/g, "");
  }
  if (integerOnly) {
    s = s.replace(/[.,]/g, "");
  } else {
    const sepIdx = s.search(/[.,]/);
    if (sepIdx >= 0) {
      const head = s.slice(0, sepIdx + 1);
      const tail = s.slice(sepIdx + 1).replace(/[.,]/g, "");
      s = head + tail;
    }
  }
  return s;
}

function defaultHint(integerOnly: boolean, allowNegative: boolean): string {
  if (integerOnly) {
    return allowNegative
      ? "Только целые числа; минус в начале — для отрицательного значения"
      : "Только целые числа";
  }
  if (allowNegative) {
    return "Только цифры; минус, запятая или точка — для отрицательных и дробных значений";
  }
  return "Только цифры; запятая или точка — для дробной части";
}

/**
 * Числовое поле ввода без стрелок-счётчиков: обычный текстовый input с числовой
 * клавиатурой. Принимает запятую как десятичный разделитель.
 */
export function NumberField({
  value,
  onChange,
  allowNegative = false,
  integerOnly = false,
  hint,
  showHint = true,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  /** Разрешить отрицательные значения (например, остаток на начало). */
  allowNegative?: boolean;
  /** Без дробной части (год, количество выплат). */
  integerOnly?: boolean;
  /** Свой текст подсказки; `false` — не показывать. */
  hint?: string | false;
  showHint?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [text, setText] = useState(String(value));
  const hintText =
    hint === false || !showHint
      ? null
      : (hint ?? defaultHint(integerOnly, allowNegative));

  useEffect(() => {
    const parsed = Number(text.replace(",", "."));
    if (parsed !== value && !(text.trim() === "" && value === 0)) {
      if (Number.isNaN(parsed) && value === 0 && text.trim() === "") return;
      if (!Number.isNaN(parsed) && parsed === value) return;
      setText(String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="number-field">
      <input
        type="text"
        inputMode={integerOnly ? "numeric" : "decimal"}
        value={text}
        onChange={(e) => {
          const raw = sanitizeNumericInput(
            e.target.value,
            allowNegative,
            integerOnly,
          );
          setText(raw);
          const parsed = Number(raw.replace(",", "."));
          onChange(raw.trim() === "" || Number.isNaN(parsed) ? 0 : parsed);
        }}
        {...rest}
      />
      {hintText && <span className="field-hint">{hintText}</span>}
    </div>
  );
}
