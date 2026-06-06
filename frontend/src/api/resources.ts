// Типобезопасные клиенты на каждый ресурс. Единственная точка общения с бэком.

import { api } from "./client";
import type {
  Asset,
  AssetInput,
  AssetList,
  AssetType,
  HistoryRow,
  Investment,
  InvestmentInput,
  InvestmentList,
  MonthRef,
  Operation,
  OperationInput,
  Plan,
  PlanInput,
  SecurityType,
  Summary,
} from "../types";

export const lookupsApi = {
  securityTypes: () => api.get<SecurityType[]>("/lookups/security-types"),
  assetTypes: () => api.get<AssetType[]>("/lookups/asset-types"),
};

export const plansApi = {
  list: () => api.get<Plan[]>("/plans"),
  create: (data: PlanInput) => api.post<Plan>("/plans", data),
  update: (id: number, data: PlanInput) => api.put<Plan>(`/plans/${id}`, data),
  remove: (id: number) => api.del(`/plans/${id}`),
  cloneNext: () => api.post<Plan[]>("/plans/clone-next"),
};

export const operationsApi = {
  list: () => api.get<Operation[]>("/operations"),
  create: (data: OperationInput) => api.post<Operation>("/operations", data),
  update: (id: number, data: OperationInput) =>
    api.put<Operation>(`/operations/${id}`, data),
  remove: (id: number) => api.del(`/operations/${id}`),
};

export const assetsApi = {
  list: () => api.get<AssetList>("/assets"),
  create: (data: AssetInput) => api.post<Asset>("/assets", data),
  update: (id: number, data: AssetInput) => api.put<Asset>(`/assets/${id}`, data),
  remove: (id: number) => api.del(`/assets/${id}`),
};

export const investmentsApi = {
  list: () => api.get<InvestmentList>("/investments"),
  create: (data: InvestmentInput) => api.post<Investment>("/investments", data),
  update: (id: number, data: InvestmentInput) =>
    api.put<Investment>(`/investments/${id}`, data),
  remove: (id: number) => api.del(`/investments/${id}`),
};

export const summaryApi = {
  months: () => api.get<MonthRef[]>("/summary/months"),
  get: (year: number, month: number) =>
    api.get<Summary>(`/summary?year=${year}&month=${month}`),
  setOpeningBalance: (year: number, month: number, value: number) =>
    api.put<Summary>("/summary/opening-balance", {
      year,
      month,
      opening_balance: value,
    }),
};

export const historyApi = {
  list: () => api.get<HistoryRow[]>("/history"),
};

export const metaApi = {
  categories: () => api.get<string[]>("/meta/categories"),
};
