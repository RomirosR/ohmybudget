import { useEffect, useState } from "react";

/** Допустимые символы: цифры, минус (если разрешён), одна точка или запятая. */
function sanitizeNumericInput(raw: string, allowNegative: boolean): string {
  let s = raw.replace(/[^\d.,-]/g, "");
  if (!allowNegative) s = s.replace(/-/g, "");
  else {
    // Минус только в начале.
    s = s.replace(/(?!^)-/g, "");
  }
  const sepIdx = s.search(/[.,]/);
  if (sepIdx >= 0) {
    const head = s.slice(0, sepIdx + 1);
    const tail = s.slice(sepIdx + 1).replace(/[.,]/g, "");
    s = head + tail;
  }
  return s;
}

/**
 * Числовое поле ввода без стрелок-счётчиков: обычный текстовый input с числовой
 * клавиатурой. Принимает запятую как десятичный разделитель.
 */
export function NumberField({
  value,
  onChange,
  allowNegative = false,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  /** Разрешить отрицательные значения (например, остаток на начало). */
  allowNegative?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [text, setText] = useState(String(value));

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
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = sanitizeNumericInput(e.target.value, allowNegative);
        setText(raw);
        const parsed = Number(raw.replace(",", "."));
        onChange(raw.trim() === "" || Number.isNaN(parsed) ? 0 : parsed);
      }}
      {...rest}
    />
  );
}
