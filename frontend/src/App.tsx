import { useState } from "react";

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

export function App() {
  const { user, isLoading, logout, openAuthModal } = useAuth();
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("plans");

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
                <span className="muted">{user.email}</span>
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
        {!user && (
          <p className="guest-banner muted">
            Вы в гостевом режиме: можно просматривать и заполнять формы. Чтобы
            сохранить запись — войдите или зарегистрируйтесь.
          </p>
        )}
        <ActiveComponent />
      </main>
      <AuthModal />
    </div>
  );
}
