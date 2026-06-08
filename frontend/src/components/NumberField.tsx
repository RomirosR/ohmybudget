import { useEffect, useRef, useState } from "react";

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

function invalidInputMessage(
  integerOnly: boolean,
  allowNegative: boolean,
): string {
  if (integerOnly) return "Можно вводить только целые числа";
  if (allowNegative) {
    return "Можно вводить только цифры, минус, запятую или точку";
  }
  return "Можно вводить только цифры, запятую или точку";
}

const HINT_HIDE_MS = 4000;

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
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
  /** Разрешить отрицательные значения (например, остаток на начало). */
  allowNegative?: boolean;
  /** Без дробной части (год, количество выплат). */
  integerOnly?: boolean;
  /** Свой текст при недопустимом вводе. */
  hint?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [text, setText] = useState(String(value));
  const [showInvalidHint, setShowInvalidHint] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hintText =
    hint ?? invalidInputMessage(integerOnly, allowNegative);

  const flashInvalidHint = () => {
    setShowInvalidHint(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowInvalidHint(false), HINT_HIDE_MS);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

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
        aria-invalid={showInvalidHint || undefined}
        onChange={(e) => {
          const incoming = e.target.value;
          const raw = sanitizeNumericInput(
            incoming,
            allowNegative,
            integerOnly,
          );
          if (incoming !== raw) flashInvalidHint();
          setText(raw);
          const parsed = Number(raw.replace(",", "."));
          onChange(raw.trim() === "" || Number.isNaN(parsed) ? 0 : parsed);
        }}
        onBlur={() => {
          setShowInvalidHint(false);
          if (hideTimer.current) clearTimeout(hideTimer.current);
        }}
        {...rest}
      />
      {showInvalidHint && (
        <span className="number-field-hint" role="status">
          {hintText}
        </span>
      )}
    </div>
  );
}
