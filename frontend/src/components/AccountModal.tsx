import { FormEvent, useState } from "react";

import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { validateEmail } from "../lib/validation";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccountModal({ open, onClose }: AccountModalProps) {
  const { user, refreshUser } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!open || !user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateEmail(newEmail);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await authApi.requestEmailChange(newEmail.trim());
      setMessage(result.message);
      setNewEmail("");
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card login-card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Аккаунт</h2>
        <p>
          Ник: <strong>{user.username}</strong>
        </p>
        <p className="muted">
          Email: {user.email}
          {user.email_verified ? "" : " (не подтверждён)"}
        </p>
        <form onSubmit={submit} className="login-form">
          <label>
            Новый email
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              maxLength={254}
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          {message && <p className="verify-banner">{message}</p>}
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "…" : "Сменить email"}
          </button>
        </form>
        <p className="muted">
          На новый адрес придёт ссылка для подтверждения.
        </p>
        <button type="button" className="link-btn" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}
