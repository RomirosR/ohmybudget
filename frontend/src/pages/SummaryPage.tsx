import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { summaryApi } from "../api/resources";
import { NumberField } from "../components/NumberField";
import { FieldError } from "../components/FieldError";
import { useGuardedAction } from "../hooks/useGuardedMutation";
import { formatMoney } from "../lib/format";
import { monthName } from "../lib/months";
import { validateBalance } from "../lib/validation";
import type { Summary } from "../types";

export function SummaryPage() {
  const qc = useQueryClient();
  const runWithAuth = useGuardedAction();
  const { data: months = [] } = useQuery({
    queryKey: ["summary-months"],
    queryFn: summaryApi.months,
  });

  const [selected, setSelected] = useState<string>("");

  // По умолчанию выбираем последний (самый поздний) месяц.
  useEffect(() => {
    if (!selected && months.length > 0) {
      const last = months[months.length - 1];
      setSelected(`${last.year}-${last.month}`);
    }
  }, [months, selected]);

  const [year, month] = selected
    ? selected.split("-").map(Number)
    : [undefined, undefined];

  const { data: summary } = useQuery({
    queryKey: ["summary", year, month],
    queryFn: () => summaryApi.get(year!, month!),
    enabled: year !== undefined && month !== undefined,
  });

  const [opening, setOpening] = useState(0);
  const [openingError, setOpeningError] = useState<string | null>(null);
  useEffect(() => {
    if (summary) setOpening(summary.opening_balance);
  }, [summary]);

  const openingMut = useMutation({
    mutationFn: () =>
      runWithAuth(
        () => summaryApi.setOpeningBalance(year!, month!, opening),
        "Зарегистрируйтесь, чтобы сохранить остаток на начало месяца.",
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summary", year, month] });
    },
  });

  return (
    <div>
      <div className="card">
        <div className="toolbar">
          <h2>Сводка</h2>
          <div className="field">
            <label>Месяц</label>
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {months.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {monthName(m.month)} {m.year}
                </option>
              ))}
            </select>
          </div>
        </div>
        {months.length === 0 && (
          <p className="muted">
            Нет месяцев. Добавьте планы на листе «Планы по месяцам».
          </p>
        )}
        {summary && (
          <div className="field" style={{ marginTop: 12 }}>
            <label>Остаток на начало месяца (вводится вручную)</label>
            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <NumberField
                  value={opening}
                  onChange={setOpening}
                  allowNegative
                />
                <button
                  className="primary"
                  onClick={() => {
                    const err = validateBalance(opening);
                    if (err) {
                      setOpeningError(err);
                      return;
                    }
                    setOpeningError(null);
                    openingMut.mutate();
                  }}
                >
                  Сохранить
                </button>
              </div>
              <FieldError message={openingError} />
            </div>
          </div>
        )}
      </div>

      {summary && <SummaryMetrics summary={summary} />}
    </div>
  );
}

function SummaryMetrics({ summary: s }: { summary: Summary }) {
  const metrics: { label: string; value: number }[] = [
    { label: "1. Остаток на начало", value: s.opening_balance },
    { label: "2. Доходы по плану", value: s.plan_income },
    { label: "3. Расходы по плану", value: s.plan_expense },
    { label: "4. Прогноз. остаток (план)", value: s.forecast_plan },
    { label: "5. Доходы факт", value: s.fact_income },
    { label: "6. Расходы факт", value: s.fact_expense },
    { label: "7. Текущий остаток (факт)", value: s.current_balance },
    { label: "8. Отклонение доходов", value: s.deviation_income },
    { label: "9. Отклонение расходов", value: s.deviation_expense },
    { label: "10. Ост. плановые доходы", value: s.remaining_plan_income },
    { label: "11. Ост. плановые расходы", value: s.remaining_plan_expense },
    { label: "12. Ожидаемый остаток (конец)", value: s.expected_end_balance },
  ];
  return (
    <div className="card">
      <div className="metrics">
        {metrics.map((m) => (
          <div className="metric" key={m.label}>
            <div className="label">{m.label}</div>
            <div className="value">{formatMoney(m.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
