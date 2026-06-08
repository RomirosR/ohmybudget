import { FormEvent, useState } from "react";

import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>
        <p className="muted">
          {mode === "login"
            ? "Войдите, чтобы увидеть свой бюджет"
            : "Создайте аккаунт для ведения бюджета"}
        </p>
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
            {pending ? "…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
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
