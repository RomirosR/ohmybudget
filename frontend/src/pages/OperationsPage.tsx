import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { metaApi, operationsApi } from "../api/resources";
import { NumberField } from "../components/NumberField";
import { FieldError } from "../components/FieldError";
import { ImportBankModal } from "../components/ImportBankModal";
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
  const [importModalOpen, setImportModalOpen] = useState(false);
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
    mutationFn: ({ file, bank }: { file: File; bank: string }) =>
      runWithAuth(
        () => operationsApi.importParse(file, bank),
        "Зарегистрируйтесь, чтобы импортировать операции.",
      ),
    onSuccess: (rows) => {
      setImportError(null);
      setImportModalOpen(false);
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
        <button
          className="primary"
          style={{ marginTop: 12 }}
          onClick={() => setImportModalOpen(true)}
        >
          Выгрузить из выписки
        </button>
      </div>
      {importModalOpen && (
        <ImportBankModal
          banks={importBanks}
          pending={parseMut.isPending}
          error={importError}
          onSubmit={(file, bank) => parseMut.mutate({ file, bank })}
          onClose={() => {
            setImportModalOpen(false);
            setImportError(null);
          }}
        />
      )}
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
