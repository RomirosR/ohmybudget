import { useState } from "react";

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
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("plans");
  const ActiveComponent =
    TABS.find((t) => t.key === active)?.Component ?? PlansPage;

  return (
    <div className="app">
      <header className="app-header">
        <h1>OhMyBudget</h1>
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
        <ActiveComponent />
      </main>
    </div>
  );
}
