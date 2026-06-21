import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { plansApi } from "../api/resources";
import { NumberField } from "../components/NumberField";
import { FieldError } from "../components/FieldError";
import { useGuardedAction } from "../hooks/useGuardedMutation";
import { formatMoney } from "../lib/format";
import { MONTH_NUMBERS, monthName } from "../lib/months";
import {
  firstError,
  LIMITS,
  validateCategory,
  validateMoney,
  validateYear,
} from "../lib/validation";
import type { Plan, PlanInput } from "../types";

export function PlansPage() {
  const qc = useQueryClient();
  const runWithAuth = useGuardedAction();
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: plansApi.list,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["plans"] });
    qc.invalidateQueries({ queryKey: ["summary-months"] });
    qc.invalidateQueries({ queryKey: ["history"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const createMut = useMutation({
    mutationFn: (data: PlanInput) =>
      runWithAuth(
        () => plansApi.create(data),
        "Зарегистрируйтесь, чтобы сохранить план.",
      ),
    onSuccess: invalidate,
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PlanInput }) =>
      runWithAuth(
        () => plansApi.update(id, data),
        "Войдите, чтобы изменять записи.",
      ),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      runWithAuth(
        () => plansApi.remove(id),
        "Войдите, чтобы удалять записи.",
      ),
    onSuccess: invalidate,
  });
  const cloneMut = useMutation({
    mutationFn: () =>
      runWithAuth(
        () => plansApi.cloneNext(),
        "Зарегистрируйтесь, чтобы скопировать план на следующий месяц.",
      ),
    onSuccess: invalidate,
  });

  // Закрываем меню по клику вне
  useEffect(() => {
    if (menuId === null) return;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

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
      return kb - ka;
    });
  }, [plans]);

  return (
    <div>
      <div className="card">
        <h2>Планы по месяцам</h2>
        <PlanForm onSubmit={(data) => createMut.mutate(data)} />
        {groups.length > 0 && (
          <button
            className="primary"
            style={{ marginTop: 12 }}
            onClick={() => cloneMut.mutate()}
            disabled={cloneMut.isPending}
          >
            Скопировать план за последний месяц
          </button>
        )}
      </div>

      {groups.length === 0 && <p className="muted">Планов пока нет.</p>}

      {groups.map((g) => (
        <div className="card" key={`${g.year}-${g.month}`}>
          <h3>
            {monthName(g.month)} {g.year}
          </h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Категория</th>
                  <th>Тип</th>
                  <th style={{ textAlign: "right" }}>План на месяц</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((p) =>
                  editingId === p.id ? (
                    <PlanEditRow
                      key={p.id}
                      plan={p}
                      onSave={(data) => updateMut.mutate({ id: p.id, data })}
                      onCancel={() => setEditingId(null)}
                      saving={updateMut.isPending}
                    />
                  ) : (
                    <PlanViewRow
                      key={p.id}
                      plan={p}
                      menuOpen={menuId === p.id}
                      onMenuToggle={(e) => {
                        e.stopPropagation();
                        setMenuId(menuId === p.id ? null : p.id);
                      }}
                      onEdit={() => { setMenuId(null); setEditingId(p.id); }}
                      onDelete={() => { setMenuId(null); deleteMut.mutate(p.id); }}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanViewRow({
  plan: p,
  menuOpen,
  onMenuToggle,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  menuOpen: boolean;
  onMenuToggle: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr>
      <td>{p.category}</td>
      <td className={p.is_income ? "income" : "expense"}>
        {p.is_income ? "Доход" : "Расход"}
      </td>
      <td style={{ textAlign: "right" }}>{formatMoney(p.amount)}</td>
      <td style={{ textAlign: "right", position: "relative" }}>
        <button className="row-menu-btn" onClick={onMenuToggle} aria-label="Действия">
          •••
        </button>
        {menuOpen && (
          <div className="row-menu-dropdown">
            <button onClick={onEdit}>Изменить</button>
            <button className="danger" onClick={onDelete}>Удалить</button>
          </div>
        )}
      </td>
    </tr>
  );
}

function PlanEditRow({
  plan: p,
  onSave,
  onCancel,
  saving,
}: {
  plan: Plan;
  onSave: (data: PlanInput) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [category, setCategory] = useState(p.category);
  const [isIncome, setIsIncome] = useState(p.is_income);
  const [amount, setAmount] = useState(p.amount);
  const [error, setError] = useState<string | null>(null);
  const firstInput = useRef<HTMLInputElement>(null);

  useEffect(() => { firstInput.current?.focus(); }, []);

  const handleSave = () => {
    const err = firstError(validateCategory(category), validateMoney(amount));
    if (err) { setError(err); return; }
    setError(null);
    onSave({ year: p.year, month: p.month, category: category.trim(), is_income: isIncome, amount });
  };

  return (
    <>
      <tr className="edit-row">
        <td>
          <input
            ref={firstInput}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={LIMITS.categoryMax}
            className="edit-input"
          />
        </td>
        <td>
          <select
            value={isIncome ? "income" : "expense"}
            onChange={(e) => setIsIncome(e.target.value === "income")}
            className="edit-input"
          >
            <option value="expense">Расход</option>
            <option value="income">Доход</option>
          </select>
        </td>
        <td>
          <NumberField value={amount} onChange={setAmount} />
        </td>
        <td style={{ whiteSpace: "nowrap" }}>
          <button className="primary" onClick={handleSave} disabled={saving} style={{ fontSize: 13, padding: "4px 10px" }}>
            ✓
          </button>{" "}
          <button className="tab" onClick={onCancel} style={{ fontSize: 13, padding: "4px 10px" }}>
            ✕
          </button>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={4}><FieldError message={error} /></td>
        </tr>
      )}
    </>
  );
}

function PlanForm({ onSubmit }: { onSubmit: (data: PlanInput) => void }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(1);
  const [category, setCategory] = useState("");
  const [isIncome, setIsIncome] = useState(false);
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="entry-form"
      onSubmit={(e) => {
        e.preventDefault();
        const err = firstError(
          validateYear(year),
          validateCategory(category),
          validateMoney(amount),
        );
        if (err) {
          setError(err);
          return;
        }
        setError(null);
        onSubmit({
          year,
          month,
          category: category.trim(),
          is_income: isIncome,
          amount,
        });
        setCategory("");
        setAmount(0);
      }}
    >
      <div className="field">
        <label>Год</label>
        <NumberField value={year} onChange={setYear} integerOnly />
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
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={LIMITS.categoryMax}
        />
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
      <FieldError message={error} />
      <button className="primary" type="submit">
        Добавить
      </button>
    </form>
  );
}
