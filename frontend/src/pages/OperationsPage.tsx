import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { metaApi, operationsApi } from "../api/resources";
import { NumberField } from "../components/NumberField";
import { FieldError } from "../components/FieldError";
import { ImportPreviewModal } from "../components/ImportPreviewModal";
import { useGuardedAction } from "../hooks/useGuardedMutation";
import { formatMoney, sortByDate } from "../lib/format";
import {
  firstError,
  LIMITS,
  validateCategory,
  validateDate,
  validateDescription,
  validateMoney,
} from "../lib/validation";
import type { OperationInput } from "../types";

export function OperationsPage() {
  const qc = useQueryClient();
  const runWithAuth = useGuardedAction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bank, setBank] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<OperationInput[] | null>(null);

  const { data: operations = [] } = useQuery({
    queryKey: ["operations"],
    queryFn: operationsApi.list,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: metaApi.categories,
  });
  const { data: importBanks = [] } = useQuery({
    queryKey: ["import-banks"],
    queryFn: metaApi.importBanks,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["operations"] });
    qc.invalidateQueries({ queryKey: ["summary"] });
    qc.invalidateQueries({ queryKey: ["history"] });
  };

  const createMut = useMutation({
    mutationFn: (data: OperationInput) =>
      runWithAuth(
        () => operationsApi.create(data),
        "Зарегистрируйтесь, чтобы сохранить операцию.",
      ),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      runWithAuth(
        () => operationsApi.remove(id),
        "Войдите, чтобы удалять записи.",
      ),
    onSuccess: invalidate,
  });
  const parseMut = useMutation({
    mutationFn: (file: File) =>
      runWithAuth(
        () => operationsApi.importParse(file, bank),
        "Зарегистрируйтесь, чтобы импортировать операции.",
      ),
    onSuccess: (rows) => {
      setImportError(null);
      setPreviewRows(rows);
    },
    onError: (err) => setImportError(err instanceof Error ? err.message : "Ошибка"),
  });
  const confirmMut = useMutation({
    mutationFn: (items: OperationInput[]) => operationsApi.importConfirm(items),
    onSuccess: () => {
      setPreviewRows(null);
      invalidate();
    },
  });

  // Сортировка на клиенте: новые сверху.
  const sorted = useMemo(() => sortByDate(operations, "desc"), [operations]);

  return (
    <div>
      <div className="card">
        <h2>Операции</h2>
        <OperationForm
          categories={categories}
          onSubmit={(data) => createMut.mutate(data)}
        />
        <div className="import-bar">
          <select value={bank} onChange={(e) => setBank(e.target.value)}>
            <option value="">Импорт из PDF — выберите банк</option>
            {importBanks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            disabled={!bank || parseMut.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) parseMut.mutate(file);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </div>
        <FieldError message={importError} />
      </div>
      {previewRows && (
        <ImportPreviewModal
          rows={previewRows}
          categories={categories}
          pending={confirmMut.isPending}
          onConfirm={(items) => confirmMut.mutate(items)}
          onClose={() => setPreviewRows(null)}
        />
      )}
      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Категория</th>
                <th>Описание</th>
                <th style={{ textAlign: "right" }}>Сумма</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o.id}>
                  <td>{o.date}</td>
                  <td className={o.is_income ? "income" : "expense"}>
                    {o.is_income ? "Доход" : "Расход"}
                  </td>
                  <td>{o.category}</td>
                  <td>{o.description}</td>
                  <td style={{ textAlign: "right" }}>{formatMoney(o.amount)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="danger" onClick={() => deleteMut.mutate(o.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && <p className="muted">Операций пока нет.</p>}
      </div>
    </div>
  );
}

function OperationForm({
  categories,
  onSubmit,
}: {
  categories: string[];
  onSubmit: (data: OperationInput) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [isIncome, setIsIncome] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="entry-form"
      onSubmit={(e) => {
        e.preventDefault();
        const err = firstError(
          validateDate(date),
          validateCategory(category),
          validateDescription(description),
          validateMoney(amount),
        );
        if (err) {
          setError(err);
          return;
        }
        setError(null);
        onSubmit({
          date,
          is_income: isIncome,
          category: category.trim(),
          description: description.trim(),
          amount,
        });
        setDescription("");
        setAmount(0);
      }}
    >
      <div className="field">
        <label>Дата</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
        <label>Категория</label>
        <input
          list="category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={LIMITS.categoryMax}
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="field">
        <label>Описание</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={LIMITS.descriptionMax}
        />
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
