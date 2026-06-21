import { useEffect, useState } from "react";

import { authApi } from "./api/auth";
import { AccountModal } from "./components/AccountModal";
import { AuthModal } from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";
import { PlansPage } from "./pages/PlansPage";
import { OperationsPage } from "./pages/OperationsPage";
import { SummaryPage } from "./pages/SummaryPage";
import { InvestmentsPage } from "./pages/InvestmentsPage";
import { AssetsPage } from "./pages/AssetsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ChartsPage } from "./pages/ChartsPage";

const TABS = [
  { key: "plans", label: "Планы по месяцам", Component: PlansPage },
  { key: "operations", label: "Операции", Component: OperationsPage },
  { key: "summary", label: "Сводка", Component: SummaryPage },
  { key: "investments", label: "Инвестиции", Component: InvestmentsPage },
  { key: "assets", label: "Активы", Component: AssetsPage },
  { key: "history", label: "История", Component: HistoryPage },
  { key: "charts", label: "Графики", Component: ChartsPage },
] as const;

type BannerState = "idle" | "pending" | "ok" | "error";

export function App() {
  const { user, isLoading, logout, openAuthModal, refreshUser } = useAuth();
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("plans");
  const [accountOpen, setAccountOpen] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState>("idle");
  const [bannerMessage, setBannerMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verify = params.get("verify");
    const reset = params.get("reset");
    const emailChange = params.get("email-change");
    const token = verify ?? reset ?? emailChange;
    if (!token) return;

    params.delete("verify");
    params.delete("reset");
    params.delete("email-change");
    const nextUrl =
      window.location.pathname +
      (params.toString() ? `?${params}` : "") +
      window.location.hash;
    window.history.replaceState({}, "", nextUrl);

    if (reset) {
      openAuthModal({
        mode: "reset",
        resetToken: token,
        message: "Задайте новый пароль.",
      });
      return;
    }

    setBannerState("pending");
    const action = verify
      ? authApi.verifyEmail(token)
      : authApi.confirmEmailChange(token);

    action
      .then(async (result) => {
        setBannerState("ok");
        setBannerMessage(result.message);
        if (verify) {
          openAuthModal({
            mode: "login",
            message: "Email подтверждён — войдите по нику и паролю.",
          });
        } else {
          await refreshUser();
        }
      })
      .catch((err) => {
        setBannerState("error");
        setBannerMessage(
          err instanceof Error ? err.message : "Ссылка недействительна",
        );
      });
  }, [openAuthModal, refreshUser]);

  if (isLoading) {
    return <div className="app-main muted">Загрузка…</div>;
  }

  const ActiveComponent =
    TABS.find((t) => t.key === active)?.Component ?? PlansPage;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <h1>OhMyBudget</h1>
          <div className="header-user">
            {user ? (
              <>
                <span className="muted">{user.username}</span>
                <button
                  type="button"
                  className="tab"
                  onClick={() => setAccountOpen(true)}
                >
                  Аккаунт
                </button>
                <button type="button" className="tab" onClick={logout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <span className="muted guest-hint">Гостевой режим</span>
                <button
                  type="button"
                  className="tab"
                  onClick={() => openAuthModal({ mode: "login" })}
                >
                  Войти
                </button>
                <button
                  type="button"
                  className="tab active"
                  onClick={() => openAuthModal({ mode: "register" })}
                >
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={t.key === active ? "tab active" : "tab"}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {bannerState === "pending" && (
          <p className="guest-banner muted">Обрабатываем ссылку…</p>
        )}
        {bannerState === "ok" && (
          <p className="guest-banner verify-banner">{bannerMessage}</p>
        )}
        {bannerState === "error" && (
          <p className="guest-banner login-error">{bannerMessage}</p>
        )}
        {!user && (
          <p className="guest-banner muted">
            Вы в гостевом режиме: можно просматривать и заполнять формы. Чтобы
            сохранить запись — войдите или зарегистрируйтесь.
          </p>
        )}
        <ActiveComponent />
      </main>
      <AuthModal />
      <AccountModal open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  );
}
