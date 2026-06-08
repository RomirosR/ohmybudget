import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { investmentsApi } from "../api/resources";
import { NumberField } from "../components/NumberField";
import { FieldError } from "../components/FieldError";
import { useGuardedAction } from "../hooks/useGuardedMutation";
import { useSecurityTypes } from "../hooks/useLookups";
import { formatMoney } from "../lib/format";
import {
  firstError,
  LIMITS,
  validateCurrentValue,
  validateInstrumentName,
  validatePayouts,
  validateRate,
} from "../lib/validation";
import type { InvestmentInput } from "../types";

export function InvestmentsPage() {
  const qc = useQueryClient();
  const runWithAuth = useGuardedAction();
  const { data: securityTypes = [] } = useSecurityTypes();
  const { data } = useQuery({
    queryKey: ["investments"],
    queryFn: investmentsApi.list,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["investments"] });
  const createMut = useMutation({
    mutationFn: (d: InvestmentInput) =>
      runWithAuth(
        () => investmentsApi.create(d),
        "Зарегистрируйтесь, чтобы сохранить инвестицию.",
      ),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      runWithAuth(
        () => investmentsApi.remove(id),
        "Войдите, чтобы удалять записи.",
      ),
    onSuccess: invalidate,
  });

  const typeName = useMemo(
    () => new Map(securityTypes.map((t) => [t.id, t.name])),
    [securityTypes],
  );

  return (
    <div>
      <div className="card">
        <div className="toolbar">
          <h2>Инвестиции</h2>
          <span className="total-badge">
            Общий среднемесячный доход:{" "}
            {formatMoney(data?.total_monthly_income ?? 0)}
          </span>
        </div>
        <InvestmentForm
          securityTypes={securityTypes}
          onSubmit={(d) => createMut.mutate(d)}
          defaultTypeId={securityTypes[0]?.id ?? 1}
        />
      </div>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Инструмент</th>
              <th>Тип</th>
              <th style={{ textAlign: "right" }}>Ставка, %</th>
              <th style={{ textAlign: "right" }}>Выплат в год</th>
              <th style={{ textAlign: "right" }}>Текущая стоимость</th>
              <th style={{ textAlign: "right" }}>Среднемес. доход</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((inv) => (
              <tr key={inv.id}>
                <td>{inv.name}</td>
                <td>{typeName.get(inv.security_type_id) ?? "?"}</td>
                <td style={{ textAlign: "right" }}>{inv.annual_rate}</td>
                <td style={{ textAlign: "right" }}>{inv.payouts_per_year}</td>
                <td style={{ textAlign: "right" }}>
                  {formatMoney(inv.current_value)}
                </td>
                <td style={{ textAlign: "right" }}>
                  {formatMoney(inv.monthly_income)}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="danger" onClick={() => deleteMut.mutate(inv.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data?.items ?? []).length === 0 && (
          <p className="muted">Инструментов пока нет.</p>
        )}
      </div>
    </div>
  );
}

function InvestmentForm({
  securityTypes,
  onSubmit,
  defaultTypeId,
}: {
  securityTypes: { id: number; name: string }[];
  onSubmit: (d: InvestmentInput) => void;
  defaultTypeId: number;
}) {
  const [name, setName] = useState("");
  const [securityTypeId, setSecurityTypeId] = useState(defaultTypeId);
  const [annualRate, setAnnualRate] = useState(0);
  const [payouts, setPayouts] = useState(12);
  const [currentValue, setCurrentValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="entry-form"
      onSubmit={(e) => {
        e.preventDefault();
        const err = firstError(
          validateInstrumentName(name),
          validateRate(annualRate),
          validatePayouts(payouts),
          validateCurrentValue(currentValue),
        );
        if (err) {
          setError(err);
          return;
        }
        setError(null);
        onSubmit({
          name: name.trim(),
          security_type_id: securityTypeId,
          annual_rate: annualRate,
          payouts_per_year: payouts,
          current_value: currentValue,
        });
        setName("");
        setAnnualRate(0);
        setCurrentValue(0);
      }}
    >
      <div className="field">
        <label>Инструмент</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={LIMITS.nameMax}
        />
      </div>
      <div className="field">
        <label>Тип</label>
        <select
          value={securityTypeId}
          onChange={(e) => setSecurityTypeId(Number(e.target.value))}
        >
          {securityTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Ставка, %</label>
        <NumberField value={annualRate} onChange={setAnnualRate} />
      </div>
      <div className="field">
        <label>Выплат в год</label>
        <NumberField value={payouts} onChange={setPayouts} />
      </div>
      <div className="field">
        <label>Текущая стоимость</label>
        <NumberField value={currentValue} onChange={setCurrentValue} />
      </div>
      <FieldError message={error} />
      <button className="primary" type="submit">
        Добавить
      </button>
    </form>
  );
}
