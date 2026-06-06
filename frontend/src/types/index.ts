// TS-типы — зеркало Pydantic-схем бэкенда. Тип Доход/Расход = is_income: boolean.

export interface Month {
  id: number;
  name: string;
  order_index: number;
}

export interface SecurityType {
  id: number;
  name: string;
}

export interface AssetType {
  id: number;
  name: string;
}

export interface Plan {
  id: number;
  year: number;
  month_id: number;
  category: string;
  is_income: boolean;
  amount: number;
}

export type PlanInput = Omit<Plan, "id">;

export interface Operation {
  id: number;
  date: string; // ISO yyyy-mm-dd
  is_income: boolean;
  category: string;
  description: string;
  amount: number;
}

export type OperationInput = Omit<Operation, "id">;

export interface Asset {
  id: number;
  date: string;
  asset_type_id: number;
  amount: number;
}

export type AssetInput = Omit<Asset, "id">;

export interface AssetList {
  items: Asset[];
  total: number;
}

export interface Investment {
  id: number;
  name: string;
  security_type_id: number;
  annual_rate: number;
  payouts_per_year: number;
  current_value: number;
  monthly_income: number;
}

export type InvestmentInput = Omit<Investment, "id" | "monthly_income">;

export interface InvestmentList {
  items: Investment[];
  total_monthly_income: number;
}

export interface MonthRef {
  year: number;
  month_id: number;
  month_name: string;
  order_index: number;
}

export interface Summary {
  year: number;
  month_id: number;
  opening_balance: number;
  plan_income: number;
  plan_expense: number;
  forecast_plan: number;
  fact_income: number;
  fact_expense: number;
  current_balance: number;
  deviation_income: number;
  deviation_expense: number;
  remaining_plan_income: number;
  remaining_plan_expense: number;
  expected_end_balance: number;
}

export interface HistoryRow {
  year: number;
  month_id: number;
  month_name: string;
  order_index: number;
  plan_income: number;
  plan_expense: number;
  fact_income: number;
  fact_expense: number;
  deviation_income: number;
  deviation_expense: number;
}
