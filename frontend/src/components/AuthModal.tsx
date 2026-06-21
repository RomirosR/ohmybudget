import { FormEvent, useEffect, useState } from "react";

import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import {
  LIMITS,
  validateEmail,
  validatePassword,
  validateUsername,
} from "../lib/validation";

const EMAIL_NOT_VERIFIED = "Email not verified";

type AuthMode = "login" | "register" | "forgot" | "reset";

export function AuthModal() {
  const { authModal, login, register, closeAuthModal } = useAuth();
  const [mode, setMode] = useState<AuthMode>("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [registerSent, setRegisterSent] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendPending, setResendPending] = useState(false);

  useEffect(() => {
    if (authModal.open) {
      setMode(authModal.defaultMode);
      setError(null);
      setRegisterSent(null);
      setInfoMessage(null);
      setPassword("");
      setPassword2("");
    }
  }, [authModal.open, authModal.defaultMode, authModal.resetToken]);

  if (!authModal.open) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);

    if (mode === "forgot") {
      const err = validateEmail(email);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setPending(true);
      try {
        const result = await authApi.forgotPassword(email.trim());
        setInfoMessage(result.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
      } finally {
        setPending(false);
      }
      return;
    }

    if (mode === "reset") {
      const token = authModal.resetToken;
      if (!token) {
        setError("Ссылка недействительна");
        return;
      }
      const err =
        validatePassword(password, "register") ??
        (password !== password2 ? "Пароли не совпадают" : null);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setPending(true);
      try {
        const result = await authApi.resetPassword(token, password);
        setInfoMessage(result.message);
        setMode("login");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
      } finally {
        setPending(false);
      }
      return;
    }

    const passMode = mode === "register" ? "register" : "login";
    const err =
      (mode === "login" || mode === "register"
        ? validateUsername(username)
        : null) ??
      (mode === "register" ? validateEmail(email) : null) ??
      validatePassword(password, passMode);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setPending(true);
    try {
      const trimmedUser = username.trim();
      if (mode === "login") {
        await login(trimmedUser, password);
        setUsername("");
        setPassword("");
      } else {
        const result = await register(trimmedUser, email.trim(), password);
        setRegisterSent(result.email);
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка авторизации");
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    const name = username.trim();
    if (!name) return;
    setResendPending(true);
    try {
      const result = await authApi.resendVerification(name);
      setInfoMessage(result.message);
    } catch (err) {
      setInfoMessage(err instanceof Error ? err.message : "Не удалось отправить");
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
            Ссылка для подтверждения отправлена на <strong>{registerSent}</strong>.
            После подтверждения войдите ником <strong>{username.trim()}</strong>.
          </p>
          {infoMessage && <p className="muted">{infoMessage}</p>}
          <div className="auth-modal-actions">
            <button type="button" className="btn-primary" disabled={resendPending} onClick={resend}>
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

  const title =
    mode === "login"
      ? "Вход"
      : mode === "register"
        ? "Регистрация"
        : mode === "forgot"
          ? "Сброс пароля"
          : "Новый пароль";

  const showResendHint = mode === "login" && error === EMAIL_NOT_VERIFIED;

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="card login-card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {authModal.message && <p className="muted">{authModal.message}</p>}
        {infoMessage && <p className="verify-banner">{infoMessage}</p>}
        <form onSubmit={submit} className="login-form">
          {(mode === "login" || mode === "register") && (
            <label>
              Ник
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                maxLength={LIMITS.usernameMax}
                pattern="[a-zA-Z0-9_]+"
              />
            </label>
          )}
          {(mode === "register" || mode === "forgot") && (
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
          )}
          {mode !== "forgot" && (
            <label>
              {mode === "reset" ? "Новый пароль" : "Пароль"}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === "login" ? 1 : LIMITS.passwordMin}
                maxLength={LIMITS.passwordMax}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </label>
          )}
          {mode === "reset" && (
            <label>
              Повторите пароль
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={LIMITS.passwordMin}
                maxLength={LIMITS.passwordMax}
                autoComplete="new-password"
              />
            </label>
          )}
          {error && <p className="login-error">{error}</p>}
          {showResendHint && (
            <p className="muted">
              Подтвердите email по ссылке из письма или запросите новое.
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending
              ? "…"
              : mode === "login"
                ? "Войти"
                : mode === "register"
                  ? "Зарегистрироваться"
                  : mode === "forgot"
                    ? "Отправить ссылку"
                    : "Сохранить пароль"}
          </button>
        </form>
        {mode === "login" && (
          <button type="button" className="link-btn" onClick={() => { setMode("forgot"); setError(null); }}>
            Забыли пароль?
          </button>
        )}
        {showResendHint && (
          <button type="button" className="link-btn" disabled={resendPending} onClick={resend}>
            {resendPending ? "…" : "Отправить письмо подтверждения ещё раз"}
          </button>
        )}
        {mode === "forgot" && (
          <button type="button" className="link-btn" onClick={() => { setMode("login"); setError(null); }}>
            Вернуться ко входу
          </button>
        )}
        {(mode === "login" || mode === "register") && (
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
        )}
      </div>
    </div>
  );
}
