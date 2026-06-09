import { FormEvent, useEffect, useState } from "react";

import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { LIMITS, validateEmail, validatePassword } from "../lib/validation";

const EMAIL_NOT_VERIFIED = "Email not verified";

export function AuthModal() {
  const { authModal, login, register, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registerSent, setRegisterSent] = useState<string | null>(null);
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authModal.open) {
      setMode(authModal.defaultMode);
      setError(null);
      setRegisterSent(null);
      setResendMessage(null);
    }
  }, [authModal.open, authModal.defaultMode]);

  if (!authModal.open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err =
      validateEmail(email) ?? validatePassword(password, mode);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setResendMessage(null);
    setPending(true);
    try {
      const trimmedEmail = email.trim();
      if (mode === "login") {
        await login(trimmedEmail, password);
        setEmail("");
        setPassword("");
      } else {
        const result = await register(trimmedEmail, password);
        setRegisterSent(result.email);
        setPassword("");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ошибка авторизации";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    const trimmedEmail = email.trim() || registerSent;
    if (!trimmedEmail) return;
    setResendPending(true);
    setResendMessage(null);
    try {
      const result = await authApi.resendVerification(trimmedEmail);
      setResendMessage(result.message);
    } catch (err) {
      setResendMessage(
        err instanceof Error ? err.message : "Не удалось отправить письмо",
      );
    } finally {
      setResendPending(false);
    }
  };

  if (registerSent) {
    return (
      <div className="modal-overlay" onClick={closeAuthModal}>
        <div className="card login-card modal-card" onClick={(e) => e.stopPropagation()}>
          <h2>Проверьте почту</h2>
          <p>
            Мы отправили ссылку для подтверждения на{" "}
            <strong>{registerSent}</strong>. Перейдите по ней, затем войдите в
            аккаунт.
          </p>
          {resendMessage && <p className="muted">{resendMessage}</p>}
          <div className="auth-modal-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={resendPending}
              onClick={resend}
            >
              {resendPending ? "…" : "Отправить письмо ещё раз"}
            </button>
            <button
              type="button"
              className="tab"
              onClick={() => {
                setRegisterSent(null);
                setMode("login");
              }}
            >
              Перейти ко входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showResendHint = mode === "login" && error === EMAIL_NOT_VERIFIED;

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
              maxLength={254}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? LIMITS.passwordMin : 1}
              maxLength={LIMITS.passwordMax}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          {showResendHint && (
            <p className="muted">
              Подтвердите email по ссылке из письма или запросите новое.
            </p>
          )}
          {showResendHint && resendMessage && (
            <p className="muted">{resendMessage}</p>
          )}
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending
              ? "…"
              : mode === "login"
                ? "Войти и сохранить"
                : "Зарегистрироваться"}
          </button>
        </form>
        {showResendHint && (
          <button
            type="button"
            className="link-btn"
            disabled={resendPending}
            onClick={resend}
          >
            {resendPending ? "…" : "Отправить письмо подтверждения ещё раз"}
          </button>
        )}
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
            setResendMessage(null);
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
