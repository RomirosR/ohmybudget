import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

export function AuthModal() {
  const { authModal, login, register, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (authModal.open) {
      setMode(authModal.defaultMode);
      setError(null);
    }
  }, [authModal.open, authModal.defaultMode]);

  if (!authModal.open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="card login-card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>
        {authModal.message && <p className="muted">{authModal.message}</p>}
        <form onSubmit={submit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending
              ? "…"
              : mode === "login"
                ? "Войти и сохранить"
                : "Зарегистрироваться и сохранить"}
          </button>
        </form>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login"
            ? "Нет аккаунта? Зарегистрироваться"
            : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </div>
  );
}
