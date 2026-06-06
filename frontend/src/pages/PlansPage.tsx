import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { plansApi } from "../api/resources";
import { NumberField } from "../components/NumberField";
import { formatMoney } from "../lib/format";
import { MONTH_NUMBERS, monthName } from "../lib/months";
import type { Plan, PlanInput } from "../types";

export function PlansPage() {
  const qc = useQueryClient();
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.list,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["plans"] });
    qc.invalidateQueries({ queryKey: ["summary-months"] });
    qc.invalidateQueries({ queryKey: ["history"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMut = useMutation({
    mutationFn: (data: PlanInput) => plansApi.create(data),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => plansApi.remove(id),
    onSuccess: invalidate,
  });
  const cloneMut = useMutation({
    mutationFn: () => plansApi.cloneNext(),
    onSuccess: invalidate,
  });

  // Группировка по (год, месяц), отсортировано по убыванию (новые сверху).
  const groups = useMemo(() => {
    const map = new Map<string, { year: number; month: number; rows: Plan[] }>();
    for (const p of plans) {
      const key = `${p.year}-${p.month}`;
      if (!map.has(key)) map.set(key, { year: p.year, month: p.month, rows: [] });
      map.get(key)!.rows.push(p);
    }
    return [...map.values()].sort((a, b) => {
      const ka = a.year * 100 + a.month;
      const kb = b.year * 100 + b.month;
      return kb - ka; // новые сверху
    });
  }, [plans]);

  return (
    <div>
      <div className="card">
        <div className="toolbar">
          <h2>Планы по месяцам</h2>
          <button
            className="primary"
            onClick={() => cloneMut.mutate()}
            disabled={plans.length === 0 || cloneMut.isPending}
          >
            План на следующий месяц
          </button>
        </div>
        <PlanForm onSubmit={(data) => createMut.mutate(data)} />
      </div>

      {groups.length === 0 && <p className="muted">Планов пока нет.</p>}

      {groups.map((g) => (
        <div className="card" key={`${g.year}-${g.month}`}>
          <h3>
            {monthName(g.month)} {g.year}
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Категория</th>
                <th>Тип</th>
                <th style={{ textAlign: "right" }}>План на месяц</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.category}</td>
                  <td className={p.is_income ? "income" : "expense"}>
                    {p.is_income ? "Доход" : "Расход"}
                  </td>
                  <td style={{ textAlign: "right" }}>{formatMoney(p.amount)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="danger"
                      onClick={() => deleteMut.mutate(p.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function PlanForm({ onSubmit }: { onSubmit: (data: PlanInput) => void }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(1);
  const [category, setCategory] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [amount, setAmount] = useState(0);

  return (
    <form
      className="entry-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!category) return;
        onSubmit({ year, month, category, is_income: isIncome, amount });
        setCategory("");
        setAmount(0);
      }}
    >
      <div className="field">
        <label>Год</label>
        <NumberField value={year} onChange={setYear} />
      </div>
      <div className="field">
        <label>Месяц</label>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTH_NUMBERS.map((m) => (
            <option key={m} value={m}>
              {monthName(m)}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Категория</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div className="field">
        <label>Тип</label>
        <select
          value={isIncome ? "income" : "expense"}
          onChange={(e) => setIsIncome(e.target.value === "income")}
        >
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </div>
      <div className="field">
        <label>Сумма</label>
        <NumberField value={amount} onChange={setAmount} />
      </div>
      <button className="primary" type="submit">
        Добавить
      </button>
    </form>
  );
}
