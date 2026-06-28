import { useState } from "react";

import { NumberField } from "./NumberField";
import type { OperationInput } from "../types";

interface PreviewRow {
  data: OperationInput;
  selected: boolean;
}

interface ImportPreviewModalProps {
  rows: OperationInput[];
  categories: string[];
  pending: boolean;
  onConfirm: (items: OperationInput[]) => void;
  onClose: () => void;
}

export function ImportPreviewModal({
  rows,
  categories,
  pending,
  onConfirm,
  onClose,
}: ImportPreviewModalProps) {
  const [preview, setPreview] = useState<PreviewRow[]>(
    rows.map((data) => ({
      data: {
        ...data,
        category: categories.includes(data.category)
          ? data.category
          : categories[0] ?? data.category,
      },
      selected: true,
    })),
  );

  const update = (index: number, patch: Partial<OperationInput>) => {
    setPreview((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, data: { ...row.data, ...patch } } : row,
      ),
    );
  };

  const toggle = (index: number) => {
    setPreview((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, selected: !row.selected } : row,
      ),
    );
  };

  const selectedCount = preview.filter((r) => r.selected).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
        <h2>Превью импорта</h2>
        <p className="muted">
          Распознано {preview.length} операций. Проверьте и отметьте, что
          импортировать.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Дата</th>
                <th>Тип</th>
                <th>Категория</th>
                <th>Описание</th>
                <th style={{ textAlign: "right" }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggle(i)}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={row.data.date}
                      onChange={(e) => update(i, { date: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={row.data.is_income ? "income" : "expense"}
                      onChange={(e) =>
                        update(i, { is_income: e.target.value === "income" })
                      }
                    >
                      <option value="expense">Расход</option>
                      <option value="income">Доход</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.data.category}
                      onChange={(e) => update(i, { category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={row.data.description}
                      onChange={(e) =>
                        update(i, { description: e.target.value })
                      }
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <NumberField
                      value={row.data.amount}
                      onChange={(amount) => update(i, { amount })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="auth-modal-actions">
          <button
            type="button"
            className="primary"
            disabled={pending || selectedCount === 0}
            onClick={() =>
              onConfirm(preview.filter((r) => r.selected).map((r) => r.data))
            }
          >
            {pending ? "…" : `Импортировать выбранные (${selectedCount})`}
          </button>
          <button type="button" className="link-btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
