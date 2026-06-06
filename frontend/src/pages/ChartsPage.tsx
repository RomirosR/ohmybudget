import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { historyApi } from "../api/resources";

export function ChartsPage() {
  const { data: rows = [] } = useQuery({
    queryKey: ["history"],
    queryFn: historyApi.list,
  });

  // Данные для графиков строятся по истории (сводка по всем месяцам).
  const data = useMemo(
    () =>
      rows.map((r) => ({
        name: `${r.month_name.slice(0, 3)} ${r.year}`,
        "Доходы план": r.plan_income,
        "Доходы факт": r.fact_income,
        "Расходы план": r.plan_expense,
        "Расходы факт": r.fact_expense,
        "Откл. доходов": r.deviation_income,
        "Откл. расходов": r.deviation_expense,
      })),
    [rows],
  );

  if (rows.length === 0) {
    return (
      <div className="card">
        <h2>Графики</h2>
        <p className="muted">Нет данных. Добавьте планы и операции.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Доходы: план vs факт</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Доходы план" fill="#9ec3ff" />
            <Bar dataKey="Доходы факт" fill="#3a6df0" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Расходы: план vs факт</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Расходы план" fill="#f0b0b0" />
            <Bar dataKey="Расходы факт" fill="#d64545" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Отклонения по месяцам (факт − план)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Откл. доходов" stroke="#1f9d55" />
            <Line type="monotone" dataKey="Откл. расходов" stroke="#d64545" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
