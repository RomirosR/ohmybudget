// Знак белорусского рубля — кириллическая «Б» с горизонтальной перечёркивающей
// линией. У символа нет своего кодпоинта в Unicode, поэтому рисуем его inline-SVG.
// Размер привязан к текущему font-size (1em), цвет наследуется (currentColor),
// чтобы знак вёл себя как обычный символ внутри текста.
export function RubleSign({ title = "белорусский рубль" }: { title?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width="0.72em"
      height="0.72em"
      role="img"
      aria-label={title}
      style={{
        display: "inline-block",
        verticalAlign: "baseline",
        marginLeft: "0.18em",
        position: "relative",
        top: "0.02em",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 13,
      }}
    >
      {/* Вертикальная стойка «Б» */}
      <line x1="32" y1="8" x2="32" y2="92" />
      {/* Верхняя горизонтальная перекладина */}
      <line x1="32" y1="8" x2="74" y2="8" />
      {/* Дуга нижней «петли» Б: от середины стойки направо и вниз к основанию */}
      <path d="M32 50 H60 a26 21 0 0 1 0 42 H32" />
      {/* Перечёркивающая линия (признак денежного знака) */}
      <line x1="10" y1="71" x2="56" y2="71" />
    </svg>
  );
}
