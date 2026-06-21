import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assetsApi } from "../api/resources";
import { NumberField } from "../components/NumberField";
import { FieldError } from "../components/FieldError";
import { useGuardedAction } from "../hooks/useGuardedMutation";
import { useAssetTypes } from "../hooks/useLookups";
import { formatMoney, sortByDate } from "../lib/format";
import {
  firstError,
  validateDate,
  validateMoney,
} from "../lib/validation";
import type { AssetInput } from "../types";

export function AssetsPage() {
  const qc = useQueryClient();
  const runWithAuth = useGuardedAction();
  const { data: assetTypes = [] } = useAssetTypes();
  const { data } = useQuery({ queryKey: ["assets"], queryFn: assetsApi.list });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["assets"] });
  const createMut = useMutation({
    mutationFn: (d: AssetInput) =>
      runWithAuth(
        () => assetsApi.create(d),
        "Зарегистрируйтесь, чтобы сохранить актив.",
      ),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      runWithAuth(
        () => assetsApi.remove(id),
        "Войдите, чтобы удалять записи.",
      ),
    onSuccess: invalidate,
  });

  const typeName = useMemo(
    () => new Map(assetTypes.map((t) => [t.id, t.name])),
    [assetTypes],
  );
  const sorted = useMemo(
    () => sortByDate(data?.items ?? [], "desc"),
    [data],
  );

  return (
    <div>
      <div className="card">
        <div className="toolbar">
          <h2>Активы</h2>
          <span className="total-badge">
            ИТОГО: {formatMoney(data?.total ?? 0)}
          </span>
        </div>
        <AssetForm
          assetTypes={assetTypes}
          onSubmit={(d) => createMut.mutate(d)}
          defaultTypeId={assetTypes[0]?.id ?? 1}
        />
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип актива</th>
                <th style={{ textAlign: "right" }}>Сумма</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{typeName.get(a.asset_type_id) ?? "?"}</td>
                  <td style={{ textAlign: "right" }}>{formatMoney(a.amount)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="danger" onClick={() => deleteMut.mutate(a.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && <p className="muted">Активов пока нет.</p>}
      </div>
    </div>
  );
}

function AssetForm({
  assetTypes,
  onSubmit,
  defaultTypeId,
}: {
  assetTypes: { id: number; name: string }[];
  onSubmit: (d: AssetInput) => void;
  defaultTypeId: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [assetTypeId, setAssetTypeId] = useState(defaultTypeId);
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="entry-form"
      onSubmit={(e) => {
        e.preventDefault();
        const err = firstError(
          validateDate(date),
          validateMoney(amount),
        );
        if (err) {
          setError(err);
          return;
        }
        setError(null);
        onSubmit({ date, asset_type_id: assetTypeId, amount });
        setAmount(0);
      }}
    >
      <div className="field">
        <label>Дата</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>Тип актива</label>
        <select
          value={assetTypeId}
          onChange={(e) => setAssetTypeId(Number(e.target.value))}
        >
          {assetTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
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
