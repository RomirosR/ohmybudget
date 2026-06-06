import { useQuery } from "@tanstack/react-query";

import { historyApi } from "../api/resources";
import { formatMoney } from "../lib/format";
import { monthName } from "../lib/months";

export function HistoryPage() {
  const { data: rows = [] } = useQuery({
    queryKey: ["history"],
    queryFn: historyApi.list,
  });

  return (
    <div className="card">
      <h2>История</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Год-Месяц</th>
            <th style={{ textAlign: "right" }}>Доходы план</th>
            <th style={{ textAlign: "right" }}>Расходы план</th>
            <th style={{ textAlign: "right" }}>Доходы факт</th>
            <th style={{ textAlign: "right" }}>Расходы факт</th>
            <th style={{ textAlign: "right" }}>Откл. доходов</th>
            <th style={{ textAlign: "right" }}>Откл. расходов</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.year}-${r.month}`}>
              <td>
                {monthName(r.month)} {r.year}
              </td>
              <td style={{ textAlign: "right" }}>{formatMoney(r.plan_income)}</td>
              <td style={{ textAlign: "right" }}>{formatMoney(r.plan_expense)}</td>
              <td style={{ textAlign: "right" }}>{formatMoney(r.fact_income)}</td>
              <td style={{ textAlign: "right" }}>{formatMoney(r.fact_expense)}</td>
              <td
                style={{ textAlign: "right" }}
                className={r.deviation_income >= 0 ? "income" : "expense"}
              >
                {formatMoney(r.deviation_income)}
              </td>
              <td
                style={{ textAlign: "right" }}
                className={r.deviation_expense <= 0 ? "income" : "expense"}
              >
                {formatMoney(r.deviation_expense)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="muted">Истории пока нет.</p>}
    </div>
  );
}
