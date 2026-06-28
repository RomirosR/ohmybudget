import { useRef, useState } from "react";

import { FieldError } from "./FieldError";

interface Bank {
  id: string;
  label: string;
}

interface ImportBankModalProps {
  banks: Bank[];
  pending: boolean;
  error: string | null;
  onSubmit: (file: File, bank: string) => void;
  onClose: () => void;
}

export function ImportBankModal({
  banks,
  pending,
  error,
  onSubmit,
  onClose,
}: ImportBankModalProps) {
  const [bank, setBank] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const nextBankError = bank ? null : "Выберите банк";
    const nextFileError = file ? null : "Выберите файл выписки";
    setBankError(nextBankError);
    setFileError(nextFileError);
    if (nextBankError || nextFileError) return;
    onSubmit(file!, bank);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Выгрузить из выписки</h2>
        <div className="import-bank-fields">
          <div className="field">
            <label>Банк *</label>
            <select
              value={bank}
              aria-invalid={bankError ? true : undefined}
              onChange={(e) => {
                setBank(e.target.value);
                if (e.target.value) setBankError(null);
              }}
            >
              <option value="">Выберите банк</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
            <FieldError message={bankError} />
          </div>
          <div className="field">
            <label>Файл выписки (PDF) *</label>
            <div className="file-picker">
              <button
                type="button"
                className="file-picker-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Выбрать файл
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="file-picker-input"
                onChange={(e) => {
                  const picked = e.target.files?.[0] ?? null;
                  setFile(picked);
                  if (picked) setFileError(null);
                }}
              />
              <span className="file-picker-name">
                {file ? file.name : "Файл не выбран"}
              </span>
            </div>
            <FieldError message={fileError} />
          </div>
        </div>
        <FieldError message={error} />
        <div className="auth-modal-actions">
          <button
            type="button"
            className="primary"
            disabled={pending}
            onClick={submit}
          >
            {pending ? "…" : "Выгрузить"}
          </button>
          <button type="button" className="link-btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
