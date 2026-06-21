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

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  useEffect(() => {
    if (authModal.open) {
      setMode(authModal.defaultMode);
      setError(null);
      setRegisterSent(null);
      setInfoMessage(null);
      setPassword("");
      setPassword2("");
      setShowPassword(false);
      setShowPassword2(false);
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
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "login" ? 1 : LIMITS.passwordMin}
                  maxLength={LIMITS.passwordMax}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
                <button
                  type="button"
                  className="password-toggle"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>
          )}
          {mode === "reset" && (
            <label>
              Повторите пароль
              <div className="password-field">
                <input
                  type={showPassword2 ? "text" : "password"}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  minLength={LIMITS.passwordMin}
                  maxLength={LIMITS.passwordMax}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  tabIndex={-1}
                  onClick={() => setShowPassword2((v) => !v)}
                  aria-label={showPassword2 ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword2 ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>
          )}
          {error && <p className="login-error">{error}</p>}
          {showResendHint && (
            <p className="muted">
              Подтвердите email по ссылке из письма или запросите новое.
            </p>
          )}
          {mode === "login" && (
            <button
              type="button"
              className="link-btn forgot-link"
              onClick={() => { setMode("forgot"); setError(null); }}
            >
              Забыли пароль?
            </button>
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
