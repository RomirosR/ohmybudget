import { useEffect, useState } from "react";

/**
 * Числовое поле ввода без стрелок-счётчиков: обычный текстовый input с числовой
 * клавиатурой. Принимает запятую как десятичный разделитель; пустая строка → 0.
 */
export function NumberField({
  value,
  onChange,
  ...rest
}: {
  value: number;
  onChange: (n: number) => void;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  // Держим локальную строку, чтобы можно было стирать поле и печатать "12.".
  const [text, setText] = useState(String(value));

  // Синхронизация, когда значение меняется извне (сброс формы и т.п.).
  useEffect(() => {
    if (Number(text.replace(",", ".")) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        const parsed = Number(raw.replace(",", "."));
        onChange(raw.trim() === "" || Number.isNaN(parsed) ? 0 : parsed);
      }}
      {...rest}
    />
  );
}
